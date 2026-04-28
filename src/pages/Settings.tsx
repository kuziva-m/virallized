import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

interface SettingsProps {
  profile?: any;
  onUpdate?: () => void;
}

const Settings = ({ profile, onUpdate }: SettingsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile States
  const [fullName, setFullName] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [goals, setGoals] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // IG Password States
  const [igPassword, setIgPassword] = useState("");
  const [confirmIgPassword, setConfirmIgPassword] = useState("");
  const [showIgPassword, setShowIgPassword] = useState(false);

  // Dashboard Auth Password States
  const [dashPassword, setDashPassword] = useState("");
  const [confirmDashPassword, setConfirmDashPassword] = useState("");
  const [showDashPassword, setShowDashPassword] = useState(false);

  // 2FA State
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    if (profile) {
      // If profile is passed from Dashboard, populate instantly
      populateState(profile);
      setIsLoading(false);
    } else {
      // Fallback: Fetch if loaded directly
      fetchUserData();
    }
  }, [profile]);

  const populateState = (data: any) => {
    setFullName(data.full_name || "");
    setIgHandle(data.ig_handle?.replace("@", "") || "");
    setNiche(data.niche || "");
    setTargetAudience(data.target_audience || "");
    setGoals(data.goals || data.target_goals || "");
    setAvatarUrl(data.avatar_url || "");
    setTwoFactorCode(data.two_factor_code || "");
  };

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("clients")
      .select(
        "full_name, ig_handle, niche, target_audience, goals, target_goals, avatar_url, two_factor_code, ig_password",
      )
      .eq("id", user.id)
      .single();

    if (data) populateState(data);
    setIsLoading(false);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      setUploadingAvatar(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Upload to your bucket
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      // Instantly save to profile
      await supabase
        .from("clients")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMessage({
        type: "error",
        text: "Error uploading image. Please try again.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // We need to fetch the existing DB record to know what their OLD password was for the email
      const { data: existingData } = await supabase
        .from("clients")
        .select("ig_password, two_factor_code")
        .eq("id", user.id)
        .single();

      // 1. Validate IG Password
      if (igPassword && igPassword !== confirmIgPassword) {
        throw new Error("Instagram passwords do not match.");
      }

      // 2. Validate Dashboard Password
      if (dashPassword && dashPassword !== confirmDashPassword) {
        throw new Error("Dashboard passwords do not match.");
      }

      // 3. Update Supabase Auth Password if provided
      if (dashPassword) {
        const { error: authError } = await supabase.auth.updateUser({
          password: dashPassword,
        });
        if (authError) throw authError;
      }

      // Format IG Handle securely
      const cleanHandle = igHandle.trim().replace(/^@/, "");
      const formattedHandle = cleanHandle ? `@${cleanHandle}` : null;

      // 4. Build payload for the clients table
      const updatePayload: any = {
        full_name: fullName,
        ig_handle: formattedHandle,
        niche: niche,
        target_audience: targetAudience,
        goals: goals,
        two_factor_code: twoFactorCode,
      };

      if (igPassword) {
        updatePayload.ig_password = igPassword;
      }

      const { error: dbError } = await supabase
        .from("clients")
        .update(updatePayload)
        .eq("id", user.id);

      if (dbError) throw dbError;

      // 🚨 DYNAMIC EMAIL TRIGGER FOR CREDENTIAL CHANGES
      const hasNewPassword = igPassword.trim() !== "";
      const hasNew2FA = twoFactorCode !== (existingData?.two_factor_code || "");

      if (hasNewPassword || hasNew2FA) {
        let emailContent = "";

        if (hasNewPassword) {
          emailContent += `
            <h3 style="color: #0b0d1f; border-bottom: 2px solid #f8f9fa; padding-bottom: 8px; margin-top: 20px;">🔐 Instagram Password Updated</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
              <tr>
                <th style="padding: 10px 0; width: 130px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Old Password:</th>
                <td style="font-family: monospace; font-size: 15px; border-bottom: 1px solid #f3f4f6;">
                  ${existingData?.ig_password ? existingData.ig_password : "<span style='color: #9ca3af;'>[None previously set]</span>"}
                </td>
              </tr>
              <tr>
                <th style="padding: 10px 0; width: 130px; color: #6b7280;">New Password:</th>
                <td style="font-family: monospace; font-size: 15px; font-weight: bold; color: #f80d5d;">
                  ${igPassword}
                </td>
              </tr>
            </table>
          `;
        }

        if (hasNew2FA) {
          emailContent += `
            <h3 style="color: #0b0d1f; border-bottom: 2px solid #f8f9fa; padding-bottom: 8px; margin-top: 20px;">🛡️ 2FA Backup Code Updated</h3>
            <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; text-align: center;">
              <p style="margin: 0; font-family: monospace; font-size: 24px; color: #10b981; font-weight: bold; letter-spacing: 4px;">
                ${twoFactorCode.trim() || "<span style='font-size: 14px; color: #9ca3af; letter-spacing: normal;'>[Removed]</span>"}
              </p>
            </div>
          `;
        }

        const emailHtml = `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #f80d5d; margin-top: 0;">Client Credentials Updated!</h2>
            <p style="font-size: 16px; color: #0b0d1f;">
              <strong>${fullName || "A client"}</strong> (${cleanHandle}) just updated their secure credentials from the dashboard.
            </p>
            ${emailContent}
          </div>
        `;

        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: "jay@virallized.com",
              subject: `🔐 Credentials Update: ${cleanHandle}`,
              html: emailHtml,
            },
          });
        } catch (emailErr) {
          console.error("Failed to send credential update email:", emailErr);
        }
      }

      setMessage({ type: "success", text: "Settings successfully updated!" });
      setIgPassword("");
      setConfirmIgPassword("");
      setDashPassword("");
      setConfirmDashPassword("");

      if (onUpdate) onUpdate(); // Refresh the Dashboard instantly

      // Auto-hide success message
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium bg-[#fafafa]">
        Loading settings...
      </div>
    );
  }

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#ff2429]/20 focus:border-[#ff2429]/50 transition-all font-medium text-[15px]";
  const labelClass =
    "block text-[13px] font-bold text-slate-900 tracking-wide mb-2";

  return (
    <div className="bg-[#fafafa] py-6 px-2 lg:px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Account Settings
        </h1>
        <p className="text-slate-600 mb-10">
          Update your profile, Instagram credentials, and security preferences.
        </p>

        {message.text && (
          <div
            className={`mb-8 p-4 rounded-xl font-bold text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* PROFILE SECTION */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"></div>
            <h2 className="text-xl font-black text-slate-900 mb-6">
              Profile Details
            </h2>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-slate-50 shadow-md bg-slate-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 font-bold text-sm">
                      No Image
                    </span>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        Uploading...
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[13px] font-bold text-[#ff2429] hover:text-[#f80d5d] transition-colors"
                >
                  Change Picture
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-6 w-full">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Instagram Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        value={igHandle}
                        onChange={(e) => setIgHandle(e.target.value)}
                        className={`${inputClass} pl-9`}
                        placeholder="yourusername"
                        required
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 my-2" />

                <div>
                  <label className={labelClass}>Your Niche</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Fitness, Real Estate, Art"
                  />
                </div>
                <div>
                  <label className={labelClass}>Ideal Follower</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Local gym goers in Austin, TX"
                  />
                </div>
                <div>
                  <label className={labelClass}>Primary Goal</label>
                  <input
                    type="text"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Gain leads for my coaching business"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INSTAGRAM CREDENTIALS */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Instagram Connection
            </h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Update your Instagram password or 2FA backup code. Leave blank if
              unchanged.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>New Instagram Password</label>
                <div className="relative">
                  <input
                    type={showIgPassword ? "text" : "password"}
                    value={igPassword}
                    onChange={(e) => setIgPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Enter new IG password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowIgPassword(!showIgPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {/* SVG Eye Icon */}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showIgPassword ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Instagram Password</label>
                <input
                  type={showIgPassword ? "text" : "password"}
                  value={confirmIgPassword}
                  onChange={(e) => setConfirmIgPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Confirm new IG password"
                />
              </div>
            </div>

            {/* 2FA Section within IG connection */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <label className={labelClass}>2-Factor Authentication Code</label>
              <p className="text-xs text-slate-500 mb-3 font-medium">
                If Instagram requests a login code, paste the 6-digit or 8-digit
                backup code here.
              </p>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className={`${inputClass} max-w-xs uppercase tracking-widest`}
                placeholder="e.g. 123456"
                maxLength={8}
              />
            </div>
          </div>

          {/* DASHBOARD SECURITY */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Dashboard Security
            </h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Update the password you use to log into this Virallized dashboard.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>New Dashboard Password</label>
                <div className="relative">
                  <input
                    type={showDashPassword ? "text" : "password"}
                    value={dashPassword}
                    onChange={(e) => setDashPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Enter new dashboard password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDashPassword(!showDashPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {showDashPassword ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm Dashboard Password</label>
                <input
                  type={showDashPassword ? "text" : "password"}
                  value={confirmDashPassword}
                  onChange={(e) => setConfirmDashPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Confirm new dashboard password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving || uploadingAvatar}
              className="w-full md:w-auto bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-10 py-4 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-[14px] shadow-lg disabled:opacity-50"
            >
              {isSaving ? "Saving Settings..." : "Save All Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
