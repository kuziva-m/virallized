import { useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How quickly will I start seeing followers?",
      a: "You’ll typically start seeing new followers within 24–72 hours of signing up. Growth ramps up gradually, and most accounts reach full speed within the first 5–7 days, depending on targeting and account activity.",
    },
    {
      q: "Are there any risks in using Virallized?",
      a: "No. Account safety is our top priority. Since 2017, we’ve helped thousands of clients grow on Instagram using organic methods, and none of our clients’ accounts have ever been put at risk. We don’t use bots, fake followers, or aggressive tactics — just real exposure to the right audience.",
    },
    {
      q: "How does Virallized actually grow my Instagram?",
      a: "Virallized works by promoting your profile to real users who are already interested in your niche, content, or industry. This increases genuine discovery and profile visits, allowing people to follow you organically because they’re genuinely interested — not because they were forced or incentivized.",
    },
    {
      q: "Are the followers I gain real people?",
      a: "Yes — every follower gained through Virallized is a real Instagram user. We don’t use bots, fake accounts, or purchased followers. Our system focuses on real exposure, which means the people who follow you do so by choice.",
    },
    {
      q: "Can I choose who my account is targeted to?",
      a: "Absolutely. Your growth is fully tailored to your goals. You can specify niches, locations, interests, competitor accounts, and audience types so your account is shown to people who are most likely to engage with your content.",
    },
    {
      q: "Is Virallized suitable for my type of account?",
      a: "Virallized works for creators, businesses, brands, and personal accounts across a wide range of niches. As long as your profile has content and a clear theme, our targeting can be adjusted to reach people who are genuinely interested in what you offer.",
    },
    {
      q: "Do you post content or send messages on my behalf?",
      a: "No. Virallized never posts content, comments, or sends DMs on your behalf. Your content, voice, and interactions remain 100% yours — we simply help the right people discover your account organically.",
    },
    {
      q: "Will I lose followers if I cancel?",
      a: "No — you won’t lose followers just because you cancel. The followers you gain are real people who chose to follow your account. As with any organic growth, people can unfollow over time, but cancelling the service itself does not remove followers.",
    },
    {
      q: "Can I cancel my subscription at any time?",
      a: "Yes — you can cancel anytime by emailing us. There are no contracts or long-term commitments.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center max-w-7xl">
        <div className="flex items-center gap-12">
          <Link to="/" className="w-40">
            <img
              src="src\images\logos\virallized-main-logo.svg"
              alt="Virallized Logo"
              className="w-full h-auto"
            />
          </Link>
          <div className="hidden md:flex gap-8 font-medium text-slate-600 text-sm">
            <a href="#how-it-works" className="hover:text-blue-600 transition">
              How it works
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition">
              Pricing
            </a>
            <a href="/blog" className="hover:text-blue-600 transition">
              Blog
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition">
              Get Started
            </a>
          </div>
        </div>
        <Link
          to="/#pricing"
          className="bg-[#3b82f6] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-sm"
        >
          Start My Growth
        </Link>
      </nav>

      {/* HERO SECTION */}
      <header className="container mx-auto px-6 pt-16 pb-24 max-w-7xl relative">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-left z-10">
            <div className="inline-flex items-center gap-2 bg-green-50/50 px-3 py-1.5 rounded-full border border-green-200 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-600 tracking-wide">
                Account Managers Online
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Get <span className="text-blue-600">Real</span>, Organic Instagram
              Followers
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
              Get as many as 3,000 real and targeted Instagram followers every
              month that actually like, comment, and engage with your content by
              using new AI technology to identify and convert your target
              audience to followers.
            </p>

            <div className="flex items-center gap-6 mb-10">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                <img
                  src="/images/icons/check-circle-green.svg"
                  alt="Check"
                  className="w-5 h-5"
                />
                Not bots
              </div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                <img
                  src="/images/icons/check-circle-green.svg"
                  alt="Check"
                  className="w-5 h-5"
                />
                No fake followers
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10">
              <Link
                to="/#pricing"
                className="bg-[#3b82f6] text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-sm"
              >
                Start My Growth
              </Link>
              <a
                href="#learn-more"
                className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                Learn More
              </a>
              <div className="hidden lg:flex items-center gap-3 ml-4">
                <img
                  src="/images/avatars/trusted-by-group.png"
                  alt="Trusted Users"
                  className="h-10"
                />
                <div className="text-xs font-bold text-slate-500 leading-tight">
                  Trusted by
                  <br />
                  <span className="text-slate-900 text-sm">12,000+ users</span>
                </div>
              </div>
            </div>

            {/* Hero Review Callout */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 max-w-md flex items-start gap-4 relative">
              <img
                src="/images/avatars/erica-henley.jpg"
                alt="Erica Henley"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-bold text-slate-900 text-sm">
                    Erica Henley
                  </div>
                  <img
                    src="/images/icons/5-stars.svg"
                    alt="5 Stars"
                    className="h-3"
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Virallized got me{" "}
                  <span className="font-bold text-slate-900">
                    over 3K new followers
                  </span>{" "}
                  in my first month and my engagement sky-rocketed! 😍
                </p>
              </div>
              <img
                src="/images/decorations/confetti-small.svg"
                alt=""
                className="absolute -bottom-4 -right-4 w-12"
              />
            </div>
          </div>

          <div className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto flex justify-center">
            {/* Main Phone Mockup */}
            <img
              src="/images/hero/iphone-mockup-main.png"
              alt="Instagram Growth App Mockup"
              className="w-full h-auto z-10 relative"
            />

            {/* Floating Notification Popups (Absolute positioning relative to the phone container) */}
            <img
              src="/images/hero/notification-popup-1.png"
              alt="+3 New Followers"
              className="absolute top-1/4 -right-10 w-48 z-20 shadow-lg"
            />
            <img
              src="/images/hero/notification-popup-2.png"
              alt="Erica started following you"
              className="absolute bottom-1/3 -left-10 w-56 z-20 shadow-lg"
            />
          </div>
        </div>
      </header>

      {/* BRAND LOGOS */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="container mx-auto px-6 max-w-5xl flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60">
          <img
            src="/images/logos/entrepreneur-logo.svg"
            alt="Entrepreneur"
            className="h-6"
          />
          <img
            src="/images/logos/layer1-logo.svg"
            alt="Layer1"
            className="h-6"
          />
          <img
            src="/images/logos/social-media-today-logo.svg"
            alt="Social Media Today"
            className="h-6"
          />
          <img
            src="/images/logos/forbes-logo.svg"
            alt="Forbes"
            className="h-6"
          />
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="Reviews" className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16 flex flex-col items-center">
            <img
              src="/images/decorations/trust-badge-icon.svg"
              alt="Trust Badge"
              className="w-16 mb-6"
            />
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Don't just take our word for it
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Over 12,000 clients trust Virallized and rave in reviews about us
              after seeing the amount of high-quality followers we bring to
              their account.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col relative">
              <p className="text-sm leading-relaxed text-slate-600 flex-1 mb-8">
                Thank you Virallized!!!! You are THE go-to for social media
                growth + engagement! I love the results I’ve seen with you!
                Smart, FAST & personable. Your company packs a powerful punch
                and you’ve got huge hearts.
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/avatars/ashlie-smith.jpg"
                    alt="@ashlie.m.smith"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      @ashlie.m.smith
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      11.6K Followers
                    </div>
                  </div>
                </div>
                <img
                  src="/images/logos/trustpilot-stars.svg"
                  alt="Trustpilot"
                  className="h-6"
                />
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col relative">
              <p className="text-sm leading-relaxed text-slate-600 flex-1 mb-8">
                I am so grateful to have found Virallized and their services!
                They helped me grow my account steadily and safely, and I felt
                comfortable trusting the process all the way through. I am
                excited for our future! Highly recommend.
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/avatars/savnhale.jpg"
                    alt="@savnhale"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      @savnhale
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      104K Followers
                    </div>
                  </div>
                </div>
                <img
                  src="/images/logos/trustpilot-stars.svg"
                  alt="Trustpilot"
                  className="h-6"
                />
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col relative">
              <p className="text-sm leading-relaxed text-slate-600 flex-1 mb-8">
                Virallized has been such a helpful service in growing my
                Instagram organically. I’ve seen a steady increase in followers
                who are genuinely interested in my content and actually stick
                around—no bots, just real engagement.
              </p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/avatars/leilovesit.jpg"
                    alt="@_leilovesit"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      @_leilovesit
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      3.3K Followers
                    </div>
                  </div>
                </div>
                <img
                  src="/images/logos/trustpilot-stars.svg"
                  alt="Trustpilot"
                  className="h-6"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO TESTIMONIALS */}
      <section
        id="learn-more"
        className="py-24 bg-white border-y border-slate-200"
      >
        <div className="container mx-auto px-6 max-w-7xl flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Our unique approach grows your Instagram{" "}
              <span className="text-blue-600">for you</span> so you can focus on
              your content
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We work with you to identify the type of followers your account
              needs, and then specifically focus our work on that audience. The
              result is your profile gaining up to 3,000 new real and targeted
              followers every month that will actually engage with your content.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/#pricing"
                className="bg-[#3b82f6] text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-sm"
              >
                Start My Growth
              </Link>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <img
                  src="/images/icons/shield-guarantee.svg"
                  alt="Guarantee"
                  className="w-5"
                />
                Results Guaranteed *
              </div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="bg-slate-100 rounded-3xl aspect-[4/3] flex flex-col items-center justify-center border border-slate-200 overflow-hidden relative">
              <img
                src="/images/video/testimonial-video-thumbnail.jpg"
                alt="Video Testimonial"
                className="w-full h-full object-cover"
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform">
                  <div className="w-0 h-0 border-t-8 border-b-8 border-l-[12px] border-transparent border-l-blue-600 ml-1"></div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-xs font-bold rounded-lg shadow-sm">
                Video Testimonials
              </div>
            </div>

            {/* Decorative Floating Popups */}
            <img
              src="/images/hero/notification-popup-1.png"
              alt="+3 New Followers"
              className="absolute -top-6 -right-6 w-40 z-20 shadow-sm"
            />
            <img
              src="/images/hero/notification-popup-2.png"
              alt="Erica started following you"
              className="absolute -bottom-6 -left-6 w-48 z-20 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20">
            <div className="inline-block bg-blue-50 text-blue-700 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-6 border border-blue-100">
              🚀{" "}
              <span className="text-slate-700">
                Get up to 3,000 followers / month
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              How it works in 3 simple steps
            </h2>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-10 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src="/images/illustrations/step-1-target-audience.svg"
                  alt="Find Target Audience"
                  className="w-full max-w-sm"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  We find your target audience{" "}
                  <img
                    src="/images/icons/confetti-small.svg"
                    className="w-6"
                    alt=""
                  />
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  With your help, we nail down the exact type of followers that
                  will benefit your page the most.
                </p>
                <Link
                  to="/#pricing"
                  className="bg-[#3b82f6] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors text-sm shadow-sm inline-block"
                >
                  Start My Growth
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-10 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src="/images/illustrations/step-2-profile-visits.png"
                  alt="Get them to profile"
                  className="w-full max-w-sm"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  We get them to your profile{" "}
                  <img
                    src="/images/icons/confetti-small.svg"
                    className="w-6"
                    alt=""
                  />
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  You’ll get thousands of new people seeing your page and
                  content, and what you have to offer.
                </p>
                <Link
                  to="/#pricing"
                  className="bg-[#3b82f6] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors text-sm shadow-sm inline-block"
                >
                  Start My Growth
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-[#fff1f2] rounded-3xl p-10 md:p-12 border border-pink-100 shadow-sm flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-1/2 relative flex justify-center">
                <img
                  src="/images/illustrations/step-3-real-followers.png"
                  alt="Get real followers"
                  className="w-full max-w-sm"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="bg-pink-200 text-pink-700 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  You get up to 3,000 real followers every month{" "}
                  <img
                    src="/images/icons/confetti-small.svg"
                    className="w-6"
                    alt=""
                  />
                </h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Because the thousands of people seeing your page are within
                  your target audience, a lot of them will end up following you.
                </p>
                <Link
                  to="/#pricing"
                  className="bg-[#3b82f6] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors text-sm shadow-sm inline-block"
                >
                  Start My Growth
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="py-24 bg-white border-y border-slate-200"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-50 text-blue-700 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-6 border border-blue-100">
              🚀{" "}
              <span className="text-slate-700">
                Get up to 3,000 followers / month
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Affordable pricing, pick a plan for you
            </h2>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span
                className={`font-bold text-sm ${isAnnual ? "text-slate-400" : "text-slate-900"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-7 bg-blue-600 rounded-full relative transition-colors focus:outline-none"
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAnnual ? "left-8" : "left-1"}`}
                ></div>
              </button>
              <div className="flex flex-col items-start">
                <span
                  className={`font-bold text-sm flex items-center gap-2 ${isAnnual ? "text-slate-900" : "text-slate-400"}`}
                >
                  Annually
                </span>
              </div>
            </div>
            {isAnnual && (
              <div className="text-xs font-medium text-slate-500 mt-3">
                60-day money back guarantee, prorated refund for unused time if
                unhappy
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Managed Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <div className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-md self-start mb-4">
                Fully Managed
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">
                Managed
              </h3>
              <p className="text-slate-500 mb-6 font-medium text-sm">
                750-3,000 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black text-slate-900">
                  ${isAnnual ? "225" : "299"}
                </span>
                <span className="text-slate-500 font-medium ml-1">/mo</span>
              </div>
              {isAnnual ? (
                <div className="text-xs font-bold text-green-600 mb-6">
                  Save 25%{" "}
                  <span className="text-slate-400 font-normal">
                    ($2,691 Paid Annually)
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mb-6">Paid Monthly</div>
              )}

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "100% Organic Growth",
                  "Our Latest AI Technology",
                  "Real Followers (No Bots)",
                  "Increased Engagement",
                  "Personal Account Manager",
                  "Quick-Start Results",
                  "Optimize Account Daily",
                  "Priority Support",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-slate-700"
                  >
                    <img
                      src="/images/icons/check-circle-gray.svg"
                      alt="Check"
                      className="w-5 h-5"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="w-full text-center bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm border border-slate-200"
              >
                Start my growth
              </a>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="bg-[#1f2937] text-white rounded-3xl p-8 border border-[#374151] shadow-lg flex flex-col transform lg:-translate-y-4">
              <div className="bg-[#3b82f6] text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-md self-start mb-4">
                Most Popular
              </div>
              <h3 className="text-2xl font-black mb-1">Pro</h3>
              <p className="text-slate-400 mb-6 font-medium text-sm">
                250-1,000 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black">
                  ${isAnnual ? "112" : "149"}
                </span>
                <span className="text-slate-400 font-medium ml-1">/mo</span>
              </div>
              {isAnnual ? (
                <div className="text-xs font-bold text-green-400 mb-6">
                  Save 25%{" "}
                  <span className="text-slate-400 font-normal">
                    ($1,341 Paid Annually)
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mb-6">Paid Monthly</div>
              )}

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "100% Organic Growth",
                  "Our Latest AI Technology",
                  "Real Followers (No Bots)",
                  "Increased Engagement",
                  "Personal Account Manager",
                  "Quick-Start Results",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-slate-200"
                  >
                    <svg
                      width="21"
                      height="16"
                      viewBox="0 0 21 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-blue-500 w-5 h-5 shrink-0"
                    >
                      <path
                        d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                        fill="currentColor"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="w-full text-center bg-[#3b82f6] text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors text-sm shadow-sm"
              >
                Start my growth
              </a>
            </div>

            {/* Standard Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
              <div className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-md self-start mb-4">
                Most Affordable
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-1">
                Standard
              </h3>
              <p className="text-slate-500 mb-6 font-medium text-sm">
                150-500 Followers / Mo.*
              </p>

              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black text-slate-900">
                  ${isAnnual ? "75" : "99"}
                </span>
                <span className="text-slate-500 font-medium ml-1">/mo</span>
              </div>
              {isAnnual ? (
                <div className="text-xs font-bold text-green-600 mb-6">
                  Save 25%{" "}
                  <span className="text-slate-400 font-normal">
                    ($891 Paid Annually)
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mb-6">Paid Monthly</div>
              )}

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "100% Organic Growth",
                  "Real Followers (No Bots)",
                  "Increased Engagement",
                  "Personal Account Manager",
                  "Quick-Start Results",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-bold text-slate-700"
                  >
                    <img
                      src="/images/icons/check-circle-gray.svg"
                      alt="Check"
                      className="w-5 h-5"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="w-full text-center bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm border border-slate-200"
              >
                Start my growth
              </a>
            </div>
          </div>
          <p className="text-center text-slate-500 mt-8 text-xs max-w-xl mx-auto font-medium">
            * Listed growth figures based on avg. client results. Results may
            vary depending on your niche and content
          </p>
        </div>
      </section>

      {/* BLOG SECTION */}
      <section className="py-24 bg-[#fafafa]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                Explore Our <span className="text-blue-600">Articles</span> and
                Insights.
              </h2>
            </div>
            <Link
              to="/blog"
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors text-sm mt-4 md:mt-0"
            >
              View All Blogs
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm col-span-1 lg:col-span-2 flex flex-col md:flex-row group cursor-pointer hover:shadow-md transition-shadow">
              <img
                src="/images/blog/blog-1-featured.jpg"
                alt="Does Instagram Growth Actually Work in 2026?"
                className="w-full md:w-1/2 object-cover h-64 md:h-auto"
              />
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
                  <img
                    src="/images/icons/calendar.svg"
                    alt="Date"
                    className="w-4"
                  />{" "}
                  January 02, 2026
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  Does Instagram Growth Actually Work in 2026?
                </h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  From Algorithm Myths to Real Growth: Instagram Strategies That
                  Work in 2026
                </p>
                <div className="text-blue-600 font-bold text-sm flex items-center gap-2">
                  Read More <span className="text-lg">→</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm group cursor-pointer hover:shadow-md transition-shadow">
              <img
                src="/images/blog/blog-2-standard.jpg"
                alt="Is Organic Instagram Growth Better Than Ads?"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
                  <img
                    src="/images/icons/calendar.svg"
                    alt="Date"
                    className="w-4"
                  />{" "}
                  March 13, 2026
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-6 group-hover:text-blue-600 transition-colors leading-snug">
                  Is Organic Instagram Growth Better Than Ads?
                </h3>
                <div className="text-blue-600 font-bold text-sm flex items-center gap-2">
                  Read More <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-white border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Still have questions? Reach out to us on live chat or{" "}
              <a
                href="mailto:support@virallized.com"
                className="text-blue-600 font-bold hover:underline"
              >
                email us
              </a>{" "}
              to get answers to questions not listed here.
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-8">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center py-5 text-left transition-colors focus:outline-none group"
                >
                  <span className="text-base font-bold text-slate-900 pr-8 group-hover:text-blue-600 transition-colors">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center shrink-0 transition-transform duration-200 ${activeFaq === index ? "bg-slate-900 border-slate-900 text-white rotate-180" : "bg-white text-slate-500"}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`text-slate-600 text-sm leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? "max-h-96 pb-6 opacity-100" : "max-h-0 pb-0 opacity-0"}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-[#1f2937] py-20 relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-left">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight leading-tight">
              Get real, organic, and targeted Instagram followers today!
            </h2>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Get started with the #1 Instagram Growth Service today and watch
              your account sky-rocket!
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/#pricing"
                className="bg-[#3b82f6] text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-colors text-sm shadow-sm"
              >
                Start my growth today
              </Link>
              <div className="flex items-center gap-2 text-xs font-bold text-white opacity-80">
                <img
                  src="/images/icons/shield-guarantee-white.svg"
                  alt="Guarantee"
                  className="w-4"
                />
                Results Guaranteed *
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-center">
            <div className="flex gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg px-4 py-2 flex items-center gap-2 text-white font-bold text-sm border border-slate-700">
                <svg
                  width="14"
                  height="11"
                  viewBox="0 0 21 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-500"
                >
                  <path
                    d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                    fill="currentColor"
                  />
                </svg>
                No Bots
              </div>
              <div className="bg-slate-800 rounded-lg px-4 py-2 flex items-center gap-2 text-white font-bold text-sm border border-slate-700">
                <svg
                  width="14"
                  height="11"
                  viewBox="0 0 21 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-500"
                >
                  <path
                    d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                    fill="currentColor"
                  />
                </svg>
                No Fake Followers
              </div>
            </div>
            <img
              src="/images/decorations/footer-cta-devices.png"
              alt="Devices"
              className="w-full max-w-md"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white text-slate-500 py-16 border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col md:flex-row gap-16 w-full md:w-1/2">
            <div className="flex flex-col gap-4">
              <div className="font-bold text-slate-900 text-sm tracking-wider uppercase mb-2">
                Product
              </div>
              <a
                href="#how-it-works"
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                How it works
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <div className="font-bold text-slate-900 text-sm tracking-wider uppercase mb-2">
                Legal
              </div>
              <a
                href="/terms-of-service"
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                Terms of service
              </a>
              <a
                href="/privacy-policy"
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                Privacy policy
              </a>
            </div>
            <div className="flex flex-col gap-4">
              <div className="font-bold text-slate-900 text-sm tracking-wider uppercase mb-2">
                Contact
              </div>
              <a
                href="mailto:support@virallized.com"
                className="text-sm font-medium hover:text-blue-600 transition"
              >
                Email us
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/3 flex flex-col items-start md:items-end text-left md:text-right">
            <img
              src="/images/logos/virallized-main-logo.svg"
              alt="Virallized"
              className="w-40 mb-4"
            />
            <p className="text-sm font-medium text-slate-500 max-w-xs">
              The #1 Instagram Growth Service in the U.S., helping clients grow
              faster on Instagram
            </p>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-7xl mt-16 pt-8 border-t border-slate-100 flex justify-center text-sm font-medium">
          © Virallized 2026. All Rights Reserved
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
