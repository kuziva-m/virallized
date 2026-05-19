import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CanceledLead {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  city: string | null;
  setup_date: string | null;
  sent: boolean;
  unsubscribed: boolean;
  created_at: string;
}

// 🚨 ADVANCED CSV PARSER 🚨
const parseCSVText = (text: string): string[][] => {
  const rows: string[][] = [];
  let curRow: string[] = [];
  let curCell = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuote && nextChar === '"') {
        curCell += '"';
        i++; // Skip escaped quote
      } else {
        inQuote = !inQuote; // Toggle quote state
      }
    } else if (char === "," && !inQuote) {
      curRow.push(curCell.trim());
      curCell = "";
    } else if ((char === "\n" || char === "\r") && !inQuote) {
      if (char === "\r" && nextChar === "\n") i++;
      curRow.push(curCell.trim());
      rows.push(curRow);
      curRow = [];
      curCell = "";
    } else {
      curCell += char;
    }
  }

  if (curCell || curRow.length > 0) {
    curRow.push(curCell.trim());
    rows.push(curRow);
  }
  return rows;
};

export const CanceledLeadsTab = ({ supabase }: { supabase: any }) => {
  const [leads, setLeads] = useState<CanceledLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [activeTemplate, setActiveTabTemplate] = useState<
    "winback" | "discount" | "custom"
  >("winback");
  const [showPreview, setShowPreview] = useState(false);

  // --- FILTER STATES ---
  const [searchFilter, setSearchFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // 🚨 MANUAL ADD LEAD STATES 🚨
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    username: "",
    email: "",
    name: "",
    setup_date: "",
  });

  // --- CUSTOM TEMPLATE BUILDER STATES ---
  const [customSubject, setCustomSubject] = useState(
    localStorage.getItem("virallized_custom_subject") ||
      "Quick question about @{username}",
  );
  const [customBody, setCustomBody] = useState(
    localStorage.getItem("virallized_custom_body") ||
      "We've made massive improvements to our AI targeting engine recently. I wanted to see if you were interested in restarting your growth?",
  );
  const [customCTA, setCustomCTA] = useState<"pricing" | "discount50" | "none">(
    (localStorage.getItem("virallized_custom_cta") as any) || "discount50",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("virallized_custom_subject", customSubject);
    localStorage.setItem("virallized_custom_body", customBody);
    localStorage.setItem("virallized_custom_cta", customCTA);
  }, [customSubject, customBody, customCTA]);

  const totalLeads = leads.length;
  const leadsWithEmail = leads.filter((l) => l.email).length;
  const sentLeads = leads.filter((l) => l.sent).length;
  const unsubscribedLeads = leads.filter((l) => l.unsubscribed).length;
  const remainingToSend = leads.filter(
    (l) => l.email && !l.sent && !l.unsubscribed,
  ).length;

  const generateCustomHtml = (username: string, name: string | null) => {
    const greeting = name ? `Hey ${name.split(" ")[0]},` : "Hi,";
    const firstNameFallback = name ? name.split(" ")[0] : "there";

    const parsedBody = customBody
      .replace(/{username}/g, `<strong>@${username}</strong>`)
      .replace(/{name}/g, firstNameFallback)
      .split("\n")
      .map((line) => (line.trim() ? `<p>${line}</p>` : ""))
      .join("");

    let ctaHtml = "";
    if (customCTA === "discount50") {
      ctaHtml = `
        <div style="background-color: #fff1f2; color: #f80d5d; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0;">
          COMEBACK50
        </div>
        <p><a href="https://www.virallized.com/#pricing" style="color: #f80d5d; font-weight: bold;">Click here to claim your 50% off discount.</a></p>
      `;
    } else if (customCTA === "pricing") {
      ctaHtml = `
        <div style="text-align: center; margin: 35px 0;">
          <a href="https://www.virallized.com/#pricing" style="background-color: #f80d5d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
            View Growth Plans
          </a>
        </div>
      `;
    }

    return `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <p>${greeting}</p>
        <p>It's Jay from Virallized.</p>
        ${parsedBody}
        ${ctaHtml}
        <p>If you have any questions at all, just reply directly to this email and I'll personally help you out.</p>
        <p>Best,<br>Jay<br>Account Manager, Virallized</p>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 40px;">Reply 'stop' to stop receiving these emails.</p>
      </div>
    `;
  };

  const EMAIL_TEMPLATES = {
    winback: {
      label: "Win-Back (Standard)",
      subject: (username: string) => `Update on your growth for @${username}`,
      html: (username: string, name: string | null) => `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; line-height: 1.6;">
          <p>${name ? `Hey ${name.split(" ")[0]},` : "Hi,"}</p>
          <p>It's Jay from Virallized. We worked together on your Instagram growth for <strong>@${username}</strong> a while back, and I just wanted to personally reach out and reconnect.</p>
          <p>Since you last used us, we've made some major improvements behind the scenes. Targeting is now much more refined, growth is more consistent overall, and we're seeing significantly better engagement quality across most niches.</p>
          <p>We've also launched a fully interactive dashboard where you can now track your growth, manage targets, whitelist users, and monitor everything in one place.</p>
          <p>If you're still working on growing the page, we'd love the chance to show you how much the system has improved since you last used it.</p>
          <p>You can get restarted here: <a href="https://www.virallized.com/#pricing" style="color: #f80d5d; font-weight: bold;">https://www.virallized.com/#pricing</a></p>
          <p>If you have any questions at all, just reply directly to this email and I'll personally help you out.</p>
          <p>Best,<br>Jay<br>Account Manager, Virallized</p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 40px;">If you don't want to receive these updates, just reply 'stop'.</p>
        </div>
      `,
    },
    discount: {
      label: "Win-Back + 50% Off",
      subject: (username: string) =>
        `Exclusive 50% off to restart @${username}`,
      html: (username: string, name: string | null) => `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; line-height: 1.6;">
          <p>${name ? `Hey ${name.split(" ")[0]},` : "Hi,"}</p>
          <p>It's Jay from Virallized. We worked together on your Instagram growth for <strong>@${username}</strong> a while back, and I just wanted to personally reach out and reconnect.</p>
          <p>Since you last used us, we've made some major improvements behind the scenes. Targeting is now much more refined, growth is more consistent overall, and we're seeing significantly better engagement quality across most niches.</p>
          <p>We've also launched a fully interactive dashboard where you can now track your growth, manage targets, whitelist users, and monitor everything in one place.</p>
          <p>To welcome you back, I've also generated a custom promo code for you to receive 50% off your first month back with us.</p>
          <div style="background-color: #fff1f2; color: #f80d5d; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0;">
            COMEBACK50
          </div>
          <p>You can restart your growth here: <a href="https://www.virallized.com/#pricing" style="color: #f80d5d; font-weight: bold;">https://www.virallized.com/#pricing</a></p>
          <p>If you have any questions at all, just reply directly to this email and I'll personally help you out.</p>
          <p>Best,<br>Jay<br>Account Manager, Virallized</p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 40px;">Reply 'unsubscribe' to stop receiving these emails.</p>
        </div>
      `,
    },
    custom: {
      label: "✨ Create Custom Template...",
      subject: (username: string) =>
        customSubject.replace(/{username}/g, username),
      html: (username: string, name: string | null) =>
        generateCustomHtml(username, name),
    },
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    let allLeads: CanceledLead[] = [];
    let hasMore = true;
    let start = 0;
    const step = 1000;

    while (hasMore) {
      const { data, error } = await supabase
        .from("canceled_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .range(start, start + step - 1);

      if (error) {
        console.error("Error fetching leads:", error);
        break;
      }

      if (data && data.length > 0) {
        allLeads = [...allLeads, ...data];
        start += step;
        if (data.length < step) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    setLeads(allLeads);
    setIsLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rows = parseCSVText(text);
      let headerIdx = -1;
      let headers: string[] = [];

      for (let i = 0; i < Math.min(rows.length, 50); i++) {
        const parsedLine = rows[i].map((h) =>
          h
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, ""),
        );

        if (
          parsedLine.includes("username") ||
          parsedLine.includes("ighandle") ||
          parsedLine.includes("handle")
        ) {
          headerIdx = i;
          headers = parsedLine;
          break;
        }
      }

      if (headerIdx === -1) {
        alert(
          "Could not find a 'Username' or 'IG Handle' column in the CSV. Please check the file formatting.",
        );
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const usernameIdx = headers.findIndex(
        (h) => h === "username" || h === "handle" || h === "ighandle",
      );
      const emailIdx = headers.findIndex(
        (h) => h === "email" || h === "emailaddress",
      );
      const nameIdx = headers.findIndex(
        (h) => h.includes("name") || h.includes("first"),
      );
      const cityIdx = headers.findIndex(
        (h) => h.includes("city") || h.includes("location"),
      );
      const setupDateIdx = headers.findIndex(
        (h) => h.includes("setup") || h.includes("date"),
      );

      const uniqueLeadsMap = new Map<string, any>();

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length === 0) continue;

        const rawUsername = usernameIdx >= 0 ? cols[usernameIdx] : null;

        if (
          !rawUsername ||
          rawUsername.trim() === "" ||
          rawUsername.includes(",,,")
        )
          continue;

        const cleanUsername = rawUsername
          .replace(/^@/, "")
          .toLowerCase()
          .trim();

        let validEmail = null;
        if (
          emailIdx >= 0 &&
          cols[emailIdx] &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cols[emailIdx].trim())
        ) {
          validEmail = cols[emailIdx].trim().toLowerCase();
        } else {
          for (const col of cols) {
            const trimmed = col.trim().toLowerCase();
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
              validEmail = trimmed;
              break;
            }
          }
        }

        const name =
          nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx].trim() : null;
        const city =
          cityIdx >= 0 && cols[cityIdx] ? cols[cityIdx].trim() : null;
        const setupDate =
          setupDateIdx >= 0 && cols[setupDateIdx]
            ? cols[setupDateIdx].trim()
            : null;

        if (uniqueLeadsMap.has(cleanUsername)) {
          const existing = uniqueLeadsMap.get(cleanUsername);
          if (!existing.email && validEmail) existing.email = validEmail;
          if (!existing.name && name) existing.name = name;
          if (!existing.city && city) existing.city = city;
          if (!existing.setup_date && setupDate)
            existing.setup_date = setupDate;
        } else {
          uniqueLeadsMap.set(cleanUsername, {
            username: cleanUsername,
            email: validEmail,
            name: name,
            city: city,
            setup_date: setupDate,
          });
        }
      }

      const newLeads = Array.from(uniqueLeadsMap.values());

      try {
        const CHUNK_SIZE = 1000;
        let importedCount = 0;

        for (let i = 0; i < newLeads.length; i += CHUNK_SIZE) {
          const chunk = newLeads.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase
            .from("canceled_leads")
            .upsert(chunk, { onConflict: "username" });

          if (error) throw error;
          importedCount += chunk.length;
        }

        alert(`Successfully imported/updated ${importedCount} leads!`);
        fetchLeads();
      } catch (err: any) {
        alert("Error importing leads: " + err.message);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // 🚨 MANUAL LEAD ADDITION LOGIC 🚨
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);

    const cleanUsername = manualForm.username
      .replace(/^@/, "")
      .toLowerCase()
      .trim();

    if (!cleanUsername) {
      alert("Instagram handle is required.");
      setIsSavingManual(false);
      return;
    }

    try {
      const { error } = await supabase.from("canceled_leads").upsert(
        [
          {
            username: cleanUsername,
            email: manualForm.email.trim() || null,
            name: manualForm.name.trim() || null,
            setup_date: manualForm.setup_date.trim() || null,
          },
        ],
        { onConflict: "username" },
      );

      if (error) throw error;

      alert(`Successfully added lead @${cleanUsername}!`);
      setIsManualAddOpen(false);
      setManualForm({ username: "", email: "", name: "", setup_date: "" });
      fetchLeads(); // Refresh table
    } catch (err: any) {
      alert("Failed to add lead: " + err.message);
    } finally {
      setIsSavingManual(false);
    }
  };

  const sendEmailToLead = async (
    lead: CanceledLead,
    templateKey: "winback" | "discount" | "custom",
  ) => {
    if (!lead.email || lead.sent || lead.unsubscribed) {
      console.warn(`Blocked attempt to email @${lead.username}`);
      return false;
    }

    const template = EMAIL_TEMPLATES[templateKey];

    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          to: lead.email,
          subject: template.subject(lead.username),
          html: template.html(lead.username, lead.name),
        },
      });

      if (error) throw error;

      await supabase
        .from("canceled_leads")
        .update({ sent: true })
        .eq("id", lead.id);

      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, sent: true } : l)),
      );
      return true;
    } catch (err) {
      console.error("Failed to send to", lead.email, err);
      return false;
    }
  };

  const startBatchSend = async () => {
    const BATCH_SIZE = 30;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const eligibleLeads = leads
      .filter((l) => l.email && !l.sent && !l.unsubscribed)
      .slice(0, BATCH_SIZE);

    if (eligibleLeads.length === 0) {
      alert("No eligible leads remaining to email!");
      return;
    }

    const confirm = window.confirm(
      `Ready to send ${eligibleLeads.length} emails using the ${EMAIL_TEMPLATES[activeTemplate].label} template?\n\nThis will take about ${((eligibleLeads.length * 2.5) / 60).toFixed(1)} minutes to safely throttle.`,
    );
    if (!confirm) return;

    setIsSendingBatch(true);

    let successCount = 0;
    for (const lead of eligibleLeads) {
      const success = await sendEmailToLead(lead, activeTemplate);
      if (success) successCount++;

      await delay(2500);
    }

    setIsSendingBatch(false);
    alert(`Batch complete! Successfully sent ${successCount} emails.`);
  };

  const toggleUnsubscribe = async (lead: CanceledLead) => {
    const newStatus = !lead.unsubscribed;
    const { error } = await supabase
      .from("canceled_leads")
      .update({ unsubscribed: newStatus })
      .eq("id", lead.id);
    if (!error) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, unsubscribed: newStatus } : l,
        ),
      );
    }
  };

  const undoSentStatus = async (lead: CanceledLead) => {
    const confirm = window.confirm(
      `Reset 'Emailed' status for @${lead.username}? This will allow them to be emailed again.`,
    );
    if (!confirm) return;

    const { error } = await supabase
      .from("canceled_leads")
      .update({ sent: false })
      .eq("id", lead.id);
    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, sent: false } : l)),
      );
    }
  };

  const deleteLead = async (lead: CanceledLead) => {
    const confirm = window.confirm(
      `Are you sure you want to permanently delete the record for @${lead.username}?`,
    );
    if (!confirm) return;

    const { error } = await supabase
      .from("canceled_leads")
      .delete()
      .eq("id", lead.id);
    if (!error) {
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    } else {
      alert("Failed to delete lead: " + error.message);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = searchFilter
      ? lead.username.includes(searchFilter.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchFilter.toLowerCase())
      : true;

    const matchesDate = dateFilter
      ? lead.setup_date?.toLowerCase().includes(dateFilter.toLowerCase())
      : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden pb-10">
      <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            Canceled Leads Outreach
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Safely re-engage churned clients without hitting spam limits.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsManualAddOpen(true)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
          >
            + Add Lead
          </button>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all whitespace-nowrap"
          >
            {isImporting ? "Importing..." : "📥 Import CSV"}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 p-4 sm:p-6 border-b border-slate-100 bg-slate-50">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Total Leads
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {totalLeads}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Has Email
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {leadsWithEmail}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mb-1">
            Emailed
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {sentLeads}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">
            Unsubbed
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {unsubscribedLeads}
          </div>
        </div>
        <div className="bg-[#fff1f2] border border-[#fda6e1] rounded-xl p-3 sm:p-4 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[10px] font-bold text-[#f80d5d] uppercase tracking-widest mb-1">
            Remaining
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#f80d5d]">
            {remainingToSend}
          </div>
        </div>
      </div>

      {/* OUTREACH CONTROL PANEL & BUILDER */}
      <div className="p-4 sm:p-6 flex flex-col border-b border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto">
            <label className="text-sm font-bold text-slate-700 hidden sm:block">
              Template:
            </label>
            <select
              value={activeTemplate}
              onChange={(e) => {
                setActiveTabTemplate(e.target.value as any);
                setShowPreview(true);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-[#f80d5d] focus:border-[#f80d5d] block w-full p-2.5 font-medium outline-none"
            >
              {Object.entries(EMAIL_TEMPLATES).map(([key, temp]) => (
                <option
                  key={key}
                  value={key}
                  className={key === "custom" ? "font-bold" : ""}
                >
                  {temp.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full sm:w-auto bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
            >
              {showPreview ? "Hide Preview" : "👁️ Preview"}
            </button>
          </div>

          <button
            onClick={startBatchSend}
            disabled={isSendingBatch || remainingToSend === 0}
            className="w-full md:w-auto bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-8 py-3 rounded-xl font-black tracking-wide hover:opacity-90 transition-opacity text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isSendingBatch ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                Sending Batch...
              </>
            ) : (
              `🚀 Send Next Batch (Max 30)`
            )}
          </button>
        </div>

        {/* 🚨 TEMPLATE BUILDER UI 🚨 */}
        {activeTemplate === "custom" && (
          <div className="mt-6 bg-slate-50 border border-slate-200 p-5 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              ✨ Smart Template Builder
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Quick question about @{username}"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Body Paragraph(s)</span>
                  <span className="text-slate-400 lowercase font-medium text-[11px]">
                    Type {`{name}`} or {`{username}`} to insert variables
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-white text-sm transition-all resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Call-To-Action Link (Auto-Generated)
                </label>
                <select
                  value={customCTA}
                  onChange={(e) => setCustomCTA(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-white text-sm transition-all outline-none"
                >
                  <option value="discount50">
                    50% Off Promo Box + Pricing Link
                  </option>
                  <option value="pricing">
                    Standard Pricing Link (View Growth Plans)
                  </option>
                  <option value="none">No Link (Plain Text Email)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 🚨 THE EMAIL PREVIEW BOX 🚨 */}
        {showPreview && (
          <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 max-w-2xl mx-auto w-full">
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-5 py-3 flex items-center justify-between">
              <div className="text-sm overflow-hidden flex flex-col sm:flex-row">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Subject:
                </span>
                <span className="sm:ml-2 font-black text-slate-900 truncate">
                  {EMAIL_TEMPLATES[activeTemplate].subject("example_user")}
                </span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 font-black px-2 text-lg leading-none ml-2 shrink-0"
              >
                ×
              </button>
            </div>
            <div
              className="bg-white p-2 sm:p-4 text-sm sm:text-base overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: EMAIL_TEMPLATES[activeTemplate].html(
                  "example_user",
                  null,
                ),
              }}
            />
          </div>
        )}
      </div>

      {/* LEADS LIST WITH FILTERS */}
      <div className="px-4 sm:px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold text-slate-900">
            Lead Database ({filteredLeads.length} Matches)
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                📅
              </span>
              <input
                type="text"
                placeholder="Filter by date (e.g. 19/04)"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d] text-sm transition-all"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search handle or email..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f80d5d] focus:ring-1 focus:ring-[#f80d5d] text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-slate-400 font-bold">
            Loading leads...
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
            {/* 🚨 MOBILE SCROLL WRAPPER 🚨 */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left text-slate-600 whitespace-nowrap min-w-[700px]">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Handle</th>
                    <th className="px-4 py-3">Signup Date</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.slice(0, 250).map((lead) => (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${lead.sent ? "bg-green-50 opacity-90" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-4 font-bold text-slate-900">
                        @{lead.username}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-500">
                        {lead.setup_date || "-"}
                      </td>
                      <td className="px-4 py-4">
                        {lead.email ? (
                          <span className="text-slate-600 font-medium">
                            {lead.email}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-[11px] font-black uppercase tracking-wider border border-orange-200 shadow-sm">
                            No Email
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {lead.unsubscribed ? (
                          <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-red-200">
                            Unsubscribed
                          </span>
                        ) : lead.sent ? (
                          <span className="bg-[#10b981] text-white px-3 py-1.5 rounded-lg text-[11px] font-black uppercase flex items-center gap-1.5 w-max shadow-sm shadow-[#10b981]/30">
                            Emailed
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-slate-200">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                        <button
                          onClick={() => toggleUnsubscribe(lead)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${lead.unsubscribed ? "bg-slate-200 text-slate-600" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                        >
                          {lead.unsubscribed ? "Resubscribe" : "Unsub"}
                        </button>

                        {lead.sent ? (
                          <button
                            onClick={() => undoSentStatus(lead)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm border border-slate-200"
                          >
                            Undo Sent
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              sendEmailToLead(lead, activeTemplate)
                            }
                            disabled={
                              !lead.email || lead.unsubscribed || isSendingBatch
                            }
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                          >
                            Send 1
                          </button>
                        )}

                        <button
                          onClick={() => deleteLead(lead)}
                          className="ml-2 text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Delete Lead"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-400 font-medium italic"
                      >
                        No leads match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 🚨 ADD MANUAL LEAD MODAL 🚨 */}
      <AnimatePresence>
        {isManualAddOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualAddOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-[#fafafa] shadow-2xl z-50 overflow-y-auto border-l border-slate-200"
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-5 flex items-center justify-between z-10 shadow-sm">
                <h2 className="text-lg font-black text-slate-900">
                  Add Lead Manually
                </h2>
                <button
                  onClick={() => setIsManualAddOpen(false)}
                  className="text-slate-400 hover:text-slate-800 font-bold text-xl px-2"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                <form
                  onSubmit={handleManualAdd}
                  className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Instagram Handle (Required)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={manualForm.username}
                        onChange={(e) =>
                          setManualForm({
                            ...manualForm,
                            username: e.target.value,
                          })
                        }
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={manualForm.email}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={manualForm.name}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, name: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="e.g. Alex"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Setup Date
                    </label>
                    <input
                      type="text"
                      value={manualForm.setup_date}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          setup_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#f80d5d]/20 focus:border-[#f80d5d] bg-slate-50 focus:bg-white text-sm font-medium"
                      placeholder="e.g. 15/05"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingManual}
                      className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isSavingManual ? "Saving..." : "Save Lead to Database"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
