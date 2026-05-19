import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const LandingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(0);

  // 🚨 NEW: State to hold the affiliate referral ID
  const [referralId, setReferralId] = useState("");

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
  ];

  // Auto-scroll logic for the reviews carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev < 5 ? prev + 1 : 0));
    }, 5000); // 5000ms = 5 seconds per slide. Adjust as needed!

    // Clear the interval if the user leaves the page
    return () => clearInterval(timer);
  }, []);

  // 🚨 REWARDFUL AFFILIATE TRACKING INJECTION & CAPTURE 🚨
  useEffect(() => {
    // 1. Initialize the Rewardful queue
    (window as any)._rwq = "rewardful";
    (window as any).rewardful =
      (window as any).rewardful ||
      function () {
        ((window as any).rewardful.q = (window as any).rewardful.q || []).push(
          arguments,
        );
      };

    // 2. Inject the script if it doesn't already exist
    if (!document.querySelector("script[data-rewardful]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://r.wdfl.co/rw.js";
      script.setAttribute("data-rewardful", "da4581"); // PUBLIC API KEY ONLY
      document.head.appendChild(script);
    }

    // 3. Capture the referral ID once Rewardful is ready
    const captureReferral = () => {
      if ((window as any).Rewardful && (window as any).Rewardful.referral) {
        setReferralId((window as any).Rewardful.referral);
      }
    };

    // Try capturing immediately
    captureReferral();
    // Also listen for the official ready event
    document.addEventListener("rewardful.ready", captureReferral);

    return () => {
      document.removeEventListener("rewardful.ready", captureReferral);
    };
  }, []);

  // 🚨 HELPER FUNCTION: Attaches the referral ID to Stripe links 🚨
  const getStripeUrl = (baseUrl: string) => {
    return referralId
      ? `${baseUrl}?client_reference_id=${referralId}`
      : baseUrl;
  };

  return (
    <>
      <SEO
        title="Instagram Growth 50% Off Offer | Virallized"
        description="Get 50% off your first month of Virallized Instagram growth services and start reaching real, targeted followers organically."
        path="/instagram-growth-50-off"
      />

      <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
        {/* 100VH HEADER & HERO WRAPPER */}
        <div className="bg-white min-h-screen lg:min-h-[calc(100vh-44px)] flex flex-col relative overflow-hidden pb-12 lg:pb-0">
          {/* SOLID BACKGROUND BLOCK WITH LOGO WATERMARK - SHIFTED RIGHT */}
          <div className="hidden lg:flex absolute inset-y-0 right-0 w-[30%] lg:w-[43%] bg-[#ffefe9] z-0 pointer-events-none overflow-hidden justify-center items-center lg:translate-x-[10%]">
            {/* FADED LOGO WATERMARK - SHIFTED RIGHT */}
            <div className="absolute w-[75%] max-w-[500px] translate-x-[10%] translate-y-[-20%]">
              <img
                src="/images/logos/shadow.svg"
                alt="Background Watermark"
                className="w-full h-auto"
              />
            </div>
          </div>
          {/* PROMO BANNER */}
          <div className="bg-[#f80d5d] text-white py-2.5 px-4 text-center text-[11px] md:text-[13px] font-bold tracking-wide relative z-50 shadow-sm">
            🎉 New to Virallized? Get 50% Off Your First Month With Code
            "FIRSTMONTH" |{" "}
            <a
              href="#pricing"
              className="underline underline-offset-2 hover:text-[#ffefe9] transition-colors"
            >
              Get Discount
            </a>{" "}
            🎉
          </div>
          {/* NAVBAR */}
          <nav className="container mx-auto px-6 lg:px-20 xl:px-24 py-4 flex justify-between items-center max-w-[90rem] relative z-50 shrink-0">
            <div className="flex items-center gap-10">
              {/* LOGO CONTAINER - REDUCED BY ANOTHER EXACT 10% */}
              <Link to="/" className="w-[108px] md:w-[122px] lg:w-[135px]">
                <img
                  src="/images/logos/virallized-main-logo.svg"
                  alt="Virallized Logo"
                  className="w-full h-auto"
                />
              </Link>
              <div className="hidden md:flex gap-6 font-medium text-slate-600 text-[10px] lg:text-[11px]">
                <a
                  href="#how-it-works"
                  className="hover:text-blue-600 transition"
                >
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

            {/* DESKTOP CTA BUTTON */}
            <div className="hidden md:block">
              {window.location.pathname === "/" ? (
                <a
                  href="#pricing"
                  className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-[10px] lg:text-[11px] hover:opacity-90 transition-opacity shadow-md"
                >
                  Start My Growth
                </a>
              ) : (
                <Link
                  to="/#pricing"
                  className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl font-bold text-[10px] lg:text-[11px] hover:opacity-90 transition-opacity shadow-md"
                >
                  Start My Growth
                </Link>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              className="md:hidden p-2 text-slate-900 hover:text-[#ff2429] transition-colors focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>

            {/* MOBILE MENU DROPDOWN */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl border-t border-slate-100 flex flex-col p-6 gap-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
                <a
                  href="#how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-800 font-extrabold text-lg tracking-tight hover:text-[#ff2429] transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-800 font-extrabold text-lg tracking-tight hover:text-[#ff2429] transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="/blog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-slate-800 font-extrabold text-lg tracking-tight hover:text-[#ff2429] transition-colors"
                >
                  Blog
                </a>
                <div className="h-px w-full bg-slate-100 my-1"></div>
                {window.location.pathname === "/" ? (
                  <a
                    href="#pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-4 rounded-xl font-bold text-[15px] hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Start My Growth
                  </a>
                ) : (
                  <Link
                    to="/#pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-4 rounded-xl font-bold text-[15px] hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Start My Growth
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* HERO SECTION */}
          <header className="flex-1 container mx-auto px-0 lg:px-20 xl:px-24 flex flex-col justify-center max-w-[90rem] relative z-10 py-12 lg:py-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-10">
              {/* TEXT CONTAINER - PERFECTLY VERTICALLY CENTERED BY FLEXBOX */}
              <div className="flex-1 text-center lg:text-left w-full lg:max-w-[460px] xl:max-w-[500px] mx-auto lg:mx-0 lg:translate-x-[10%]">
                {/* Account Managers Online Badge */}
                <div className="inline-flex items-center gap-2.5 bg-white px-4 py-2 lg:px-4 lg:py-2 rounded-full border border-slate-200 mb-6 lg:mb-5 shadow-sm relative mx-auto lg:mx-0">
                  <div className="relative flex items-center justify-center h-2.5 w-2.5 rounded-full bg-green-100 border border-green-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                  </div>
                  <span className="text-[10px] lg:text-[10.5px] font-extrabold text-slate-800 tracking-wide uppercase">
                    Account Managers Online
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-[2.6rem] md:text-5xl lg:text-[2.65rem] xl:text-[3rem] font-extrabold text-slate-900 leading-[1.15] mb-6 lg:mb-5 tracking-tight w-[90%] mx-auto lg:w-full lg:mx-0">
                  Get{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
                    Real
                  </span>
                  , Organic
                  <br />
                  Instagram Followers
                </h1>

                {/* Subheading */}
                <p className="text-[15px] lg:text-[15px] text-slate-600 mb-8 lg:mb-6 leading-relaxed w-[90%] mx-auto lg:mx-0">
                  Get as many as 3,000 real and targeted Instagram followers
                  every month that actually like, comment, and engage with your
                  content.
                </p>

                {/* Checks */}
                <div className="flex items-center justify-center lg:justify-start gap-6 lg:gap-5 mb-10 lg:mb-8 w-[90%] mx-auto lg:w-full lg:mx-0">
                  <div className="flex items-center gap-2 lg:gap-2 font-bold text-[14px] lg:text-[13px] text-slate-700">
                    <img
                      src="/images/check.svg"
                      alt="Check"
                      className="w-5 h-5 lg:w-4 lg:h-4"
                    />
                    Not bots
                  </div>
                  <div className="flex items-center gap-2 lg:gap-2 font-bold text-[14px] lg:text-[13px] text-slate-700">
                    <img
                      src="/images/check.svg"
                      alt="Check"
                      className="w-5 h-5 lg:w-4 lg:h-4"
                    />
                    No fake followers
                  </div>
                </div>

                {/* HERO CTA BUTTONS */}
                <div className="flex flex-col xl:flex-row items-center justify-center lg:justify-start gap-5 lg:gap-4 mb-12 lg:mb-10 w-[90%] mx-auto lg:w-full lg:mx-0">
                  <div className="flex flex-row items-center justify-center lg:justify-start gap-3 w-full lg:w-auto">
                    {window.location.pathname === "/" ? (
                      <a
                        href="#pricing"
                        className="flex-1 lg:flex-none text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-4 lg:px-6 lg:py-3 rounded-xl font-bold text-[14px] lg:text-[13px] shadow-lg whitespace-nowrap"
                      >
                        Start My Growth
                      </a>
                    ) : (
                      <Link
                        to="/#pricing"
                        className="flex-1 lg:flex-none text-center bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white px-6 py-4 lg:px-6 lg:py-3 rounded-xl font-bold text-[14px] lg:text-[13px] shadow-lg whitespace-nowrap"
                      >
                        Start My Growth
                      </Link>
                    )}
                    <a
                      href="#learn-more"
                      className="flex-1 lg:flex-none text-center bg-slate-900 text-white px-6 py-4 lg:px-6 lg:py-3 rounded-xl font-bold text-[14px] lg:text-[13px] shadow-md hover:bg-slate-800 transition-colors"
                    >
                      Learn More
                    </a>
                  </div>
                  {/* Trust Badge */}
                  <div className="flex items-center gap-3 mt-2 xl:mt-0 xl:ml-3 bg-slate-50 xl:bg-transparent px-4 py-2 xl:p-0 rounded-xl border border-slate-100 xl:border-none">
                    <img
                      src="/images/trusted-by-group.avif"
                      alt="Trusted Users"
                      className="h-7 lg:h-7"
                    />
                    <div className="text-[10px] lg:text-[9px] font-bold text-slate-500 leading-tight text-left">
                      Trusted by
                      <br />
                      <span className="text-slate-900 text-[12px] lg:text-[11px]">
                        12,000+ users
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Callout */}
                <div className="bg-white p-5 lg:p-4 rounded-2xl shadow-lg border border-slate-100 w-[90%] max-w-[360px] lg:max-w-[340px] flex items-start gap-4 lg:gap-3 relative mx-auto lg:mx-0 text-left">
                  <img
                    src="/images/Erica-Henlyh.avif"
                    alt="Erica"
                    className="w-10 h-10 lg:w-9 lg:h-9 rounded-full shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1 lg:mb-1">
                      <div className="font-bold text-slate-900 text-[13px] lg:text-[11px]">
                        Erica Henley
                      </div>
                      <img
                        src="/images/5stars.svg"
                        alt="5 Stars"
                        className="h-3 lg:h-2.5"
                      />
                    </div>
                    <p className="text-[12px] lg:text-[11px] text-slate-600 leading-relaxed">
                      Virallized got me{" "}
                      <span className="font-bold text-slate-900">
                        over 3K new followers
                      </span>{" "}
                      in my first month! 😍
                    </p>
                  </div>
                  <img
                    src="/images/decorations/confetti-small.svg"
                    className="absolute -bottom-4 -right-4 w-8 lg:w-7"
                    alt=""
                  />
                </div>
              </div>

              {/* Mock iPhone */}
              <div className="hidden lg:flex flex-1 relative w-full lg:max-w-[28rem] xl:max-w-[32rem] mx-auto justify-start lg:translate-x-[20%] lg:translate-y-16 xl:translate-y-20 lg:scale-105 xl:scale-110 origin-bottom">
                <img
                  src="/images/iphone-mockup-main.avif"
                  alt="Mockup"
                  className="w-full h-auto z-10 relative drop-shadow-2xl"
                />
              </div>
            </div>
          </header>
        </div>

        {/* BRAND LOGOS */}
        <section className="bg-white py-10 lg:py-12 border-t border-slate-100">
          <div className="container mx-auto px-6 max-w-5xl flex flex-wrap justify-center md:justify-between items-center gap-8 brightness-0 opacity-40 hover:opacity-60 transition-opacity duration-300">
            <img
              src="/images/entrepreneur-logo.svg"
              alt="Entrepreneur"
              className="h-5 lg:h-6"
            />
            <img src="/images/huff.svg" alt="HuffPost" className="h-5 lg:h-6" />
            <img
              src="/images/socialmedia.svg"
              alt="Social Media Today"
              className="h-5 lg:h-6"
            />
            <img src="/images/forbes.svg" alt="Forbes" className="h-5 lg:h-6" />
          </div>
        </section>

        {/* REVIEWS SECTION */}
        <section
          id="Reviews"
          className="py-20 lg:py-24 bg-[#fafafa] overflow-hidden"
        >
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-12 flex flex-col items-center">
              <img
                src="/images/Group10.svg"
                alt="Trust Badge"
                className="w-14 lg:w-16 mb-6"
              />
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                Don't just take our word for it
              </h2>
              <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
                Over 12,000 clients trust Virallized and rave in reviews about
                us.
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* CAROUSEL TRACK */}
              <div
                className="flex transition-transform duration-500 ease-in-out items-stretch"
                style={{ transform: `translateX(-${currentReview * 100}%)` }}
              >
                {[
                  {
                    name: "@tonys_mma_corner",
                    count: "27.9K Followers",
                    img: "tonys_mma_corner.avif",
                    link: "https://www.trustpilot.com/reviews/66e1a30e6a5e4a178bb582c5",
                    text: "My experience has been great with Virallized. They have made good on all of their promises and they are easy to work with. Growing from scratch like I have on Instagram is tough by yourself. I know because I have tried. Virallized does the grunt for you so you don't have to worry about it - I just get to worry about making content and Virallized helped me build a following of real followers, not bot accounts. Definitely recommended if you are starting from scratch.",
                  },
                  {
                    name: "@erikagivens_art",
                    count: "4.6K Followers",
                    img: "erikagivens_art.avif",
                    link: "https://www.trustpilot.com/reviews/673ca91a93c0d26b15290133",
                    text: "As a busy artist, I don’t have time for marketing or networking on social media, and Virallized has genuinely made that part easy. The growth hasn’t felt random at all - the outreach has been clearly targeted to the artistic styles and themes I specified, and I’ve connected with real artists who actually engage with my work. If you’re an artist looking to get out of your bubble and gain exposure within your field, I’d absolutely recommend Virallized.",
                  },
                  {
                    name: "@thewellbeingchannel",
                    count: "38.3K Followers",
                    img: "thewellbeingchannel.avif",
                    link: "https://www.trustpilot.com/reviews/686cb21cb33813291e73da98",
                    text: "Virallized and their team have been very supportive in growing my Instagram and answered all my queries promptly. I would highly recommend their service to anyone looking to grow their Instagram without the usual stress or guesswork.",
                  },
                  {
                    name: "@_leilovesit",
                    count: "3.3K Followers",
                    img: "t3.avif",
                    link: "https://www.trustpilot.com/users/67f73d10959ac3801827cec6",
                    text: "Virallized has been such a helpful service in growing my Instagram organically. I’ve seen a steady increase in followers who are genuinely interested in my content and actually stick around—no bots, just real engagement.",
                  },
                  {
                    name: "@ashlie.m.smith",
                    count: "11.6K Followers",
                    img: "t1.avif",
                    link: "https://www.trustpilot.com/review/virallized.com",
                    text: "Thank you Virallized!!!! You are THE go-to for social media growth + engagement! I love the results I’ve seen with you! Smart, FAST & personable. Your company packs a powerful punch and you’ve got huge hearts.",
                  },
                  {
                    name: "@savnhale",
                    count: "104K Followers",
                    img: "t2.avif",
                    link: "https://www.trustpilot.com/review/virallized.com",
                    text: "I am so grateful to have found Virallized and their services! They helped me grow my account steadily and safely, and I felt comfortable trusting the process all the way through. I am excited for our future! Highly recommend.",
                  },
                ].map((review, i) => (
                  <div
                    key={i}
                    className="w-full h-full flex-shrink-0 px-2 lg:px-4 flex items-center justify-center"
                  >
                    <a
                      href={review.link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full block bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative cursor-pointer"
                    >
                      <div className="absolute top-6 right-6 md:top-8 md:right-8 opacity-20">
                        <img
                          src="/images/trustpilot.svg"
                          alt="Trustpilot"
                          className="h-6 md:h-8"
                        />
                      </div>

                      <p className="text-base md:text-lg leading-relaxed text-slate-600 flex-1 mb-10 pr-4 mt-4">
                        "{review.text}"
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={`/images/${review.img}`}
                            alt={review.name}
                            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shadow-sm"
                          />
                          <div>
                            <div className="font-black text-slate-900 text-[15px] md:text-[17px]">
                              {review.name}
                            </div>
                            <div className="text-[13px] text-[#f80d5d] font-bold tracking-wide">
                              {review.count}
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>

              {/* CAROUSEL NAVIGATION ARROWS */}
              <button
                onClick={() =>
                  setCurrentReview((prev) => (prev > 0 ? prev - 1 : 5))
                }
                className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 md:p-4 shadow-lg border border-slate-100 text-slate-900 hover:text-[#f80d5d] hover:scale-110 transition-all z-10"
                aria-label="Previous Review"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={() =>
                  setCurrentReview((prev) => (prev < 5 ? prev + 1 : 0))
                }
                className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 md:p-4 shadow-lg border border-slate-100 text-slate-900 hover:text-[#f80d5d] hover:scale-110 transition-all z-10"
                aria-label="Next Review"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* DOT INDICATORS */}
              <div className="flex justify-center gap-2 md:gap-3 mt-8">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentReview(idx)}
                    className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                      currentReview === idx
                        ? "bg-gradient-to-r from-[#ffae07] to-[#f80d5d] w-6 md:w-8"
                        : "bg-slate-300 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trustpilot glow card */}
        <section className="px-6 py-12">
          <a
            href="https://www.trustpilot.com/review/virallized.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-green-500/10 hover:shadow-green-500/30 hover:-translate-y-1 transition-all duration-300 p-8 lg:py-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 w-full max-w-7xl mx-auto"
          >
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight max-w-[320px] text-center lg:text-left leading-[1.15] shrink-0">
              We help people grow their Instagram fast
            </h3>
            <div className="flex flex-wrap justify-center lg:justify-between items-center gap-8 md:gap-10 lg:gap-4 flex-1 w-full">
              <img
                src="/images/insta.svg"
                alt="Insta"
                className="h-16 md:h-20 lg:h-24 object-contain"
              />
              <img
                src="/images/trustpilot.svg"
                alt="Trustpilot"
                className="h-16 md:h-20 lg:h-24 object-contain"
              />
              <img
                src="/images/badge-shield.svg"
                alt="Shield"
                className="h-16 md:h-20 lg:h-24 object-contain"
              />
              <img
                src="/images/badge-secure.svg"
                alt="Secure"
                className="h-16 md:h-20 lg:h-24 object-contain"
              />
            </div>
          </a>
        </section>

        {/* TESTIMONIALS / LEARN MORE */}
        <section
          id="learn-more"
          className="py-20 lg:py-24 bg-white border-y border-slate-200"
        >
          <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem] flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-left lg:translate-x-2">
              <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.15]">
                Our unique approach grows your Instagram{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%]">
                  for you
                </span>{" "}
                so you can focus on your content
              </h2>
              <p className="text-sm lg:text-[15px] text-slate-600 mb-8 leading-relaxed max-w-xl">
                We work with you to identify the type of followers your account
                needs, and then specifically focus our work on that audience.
                The result is your profile gaining up to 3,000 new real and
                targeted followers every month that will actually engage with
                your content.
              </p>
              <div className="flex items-center gap-5">
                {window.location.pathname === "/" ? (
                  <a
                    href="#pricing"
                    className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-7 lg:py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md text-sm"
                  >
                    Start My Growth
                  </a>
                ) : (
                  <Link
                    to="/#pricing"
                    className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-7 lg:py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-md text-sm"
                  >
                    Start My Growth
                  </Link>
                )}
                <div className="flex items-center gap-2 text-[13px] lg:text-sm font-bold text-slate-700">
                  <img
                    src="/images/sheild.svg"
                    alt="Guarantee"
                    className="w-4 lg:w-5"
                  />
                  Results Guaranteed *
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 lg:py-24 bg-[#fafafa]">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16 lg:mb-20">
              <div className="inline-block font-bold text-[15px] lg:text-[16px] uppercase tracking-wider mb-6">
                🚀{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%]">
                  Get up to 3,000 followers / month
                </span>
              </div>
              <h2 className="text-5xl md:text-[48px] lg:text-[63px] font-black text-slate-900 tracking-tight">
                How it works in 3 simple steps
              </h2>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-10 lg:gap-12">
                <div className="w-full md:w-1/2 flex justify-center">
                  <img
                    src="/images/step1.svg"
                    alt="Find Target Audience"
                    className="w-full max-w-[280px] lg:max-w-sm"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <div className="bg-[#ffefe9] text-[#ffae07] w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-[21px] lg:text-[24px] mb-5 lg:mb-6">
                    1
                  </div>
                  <h3 className="text-[26px] lg:text-[32px] font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                    We find your target audience{" "}
                    <img
                      src="/images/confetti.svg"
                      className="w-6 lg:w-7"
                      alt=""
                    />
                  </h3>
                  <p className="text-[18px] lg:text-[21px] text-slate-600 mb-6 lg:mb-8 leading-relaxed">
                    With your help, we nail down the exact type of followers
                    that will benefit your page the most.
                  </p>
                  <div className="flex flex-row items-center gap-4">
                    {window.location.pathname === "/" ? (
                      <a
                        href="#pricing"
                        className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                      >
                        Start My Growth
                      </a>
                    ) : (
                      <Link
                        to="/#pricing"
                        className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                      >
                        Start My Growth
                      </Link>
                    )}
                    <div className="flex items-center gap-1.5 lg:gap-2 text-[15px] lg:text-[17px] font-bold text-slate-500">
                      <img
                        src="/images/sheild.svg"
                        alt="Guarantee"
                        className="w-4 lg:w-5 opacity-75"
                      />
                      Results Guaranteed *
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row-reverse items-center gap-10 lg:gap-12">
                <div className="w-full md:w-1/2 flex justify-center">
                  <img
                    src="/images/step2.avif"
                    alt="Get them to profile"
                    className="w-full max-w-[280px] lg:max-w-sm"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <div className="bg-[#ffefe9] text-[#ff2429] w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-[21px] lg:text-[24px] mb-5 lg:mb-6">
                    2
                  </div>
                  <h3 className="text-[26px] lg:text-[32px] font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                    We get them to your profile{" "}
                    <img
                      src="/images/icons/confetti-small.svg"
                      className="w-6 lg:w-7"
                      alt=""
                    />
                  </h3>
                  <p className="text-[18px] lg:text-[21px] text-slate-600 mb-6 lg:mb-8 leading-relaxed">
                    You’ll get thousands of new people seeing your page and
                    content, and what you have to offer.
                  </p>
                  <div className="flex flex-row items-center gap-4">
                    {window.location.pathname === "/" ? (
                      <a
                        href="#pricing"
                        className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                      >
                        Start My Growth
                      </a>
                    ) : (
                      <Link
                        to="/#pricing"
                        className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                      >
                        Start My Growth
                      </Link>
                    )}
                    <div className="flex items-center gap-1.5 lg:gap-2 text-[15px] lg:text-[17px] font-bold text-slate-500">
                      <img
                        src="/images/sheild.svg"
                        alt="Guarantee"
                        className="w-4 lg:w-5 opacity-75"
                      />
                      Results Guaranteed *
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#ffefe9]/40 rounded-3xl p-8 md:p-12 border border-[#ffefe9] shadow-sm flex flex-col md:flex-row items-center gap-10 lg:gap-12">
                <div className="w-full md:w-1/2 relative flex justify-center">
                  <img
                    src="/images/step3.avif"
                    alt="Get real followers"
                    className="w-full max-w-[280px] lg:max-w-sm"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <div className="bg-[#ffefe9] text-[#f1078d] w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center font-black text-[21px] lg:text-[24px] mb-5 lg:mb-6">
                    3
                  </div>
                  <h3 className="text-[26px] lg:text-[32px] font-bold text-slate-900 mb-3 lg:mb-4 flex items-center gap-2">
                    You get up to 3,000 real followers every month{" "}
                    <img
                      src="/images/icons/confetti-small.svg"
                      className="w-6 lg:w-7"
                      alt=""
                    />
                  </h3>
                  <p className="text-[18px] lg:text-[21px] text-slate-600 mb-6 lg:mb-8 leading-relaxed">
                    Because the thousands of people seeing your page are within
                    your target audience, a lot of them will end up following
                    you.
                  </p>
                  <div className="flex flex-row items-center gap-4">
                    {window.location.pathname === "/" ? (
                      <a
                        href="#pricing"
                        className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                      >
                        Start My Growth
                      </a>
                    ) : (
                      <Link
                        to="/#pricing"
                        className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-[17px] lg:text-[18px] shadow-md whitespace-nowrap"
                      >
                        Start My Growth
                      </Link>
                    )}
                    <div className="flex items-center gap-1.5 lg:gap-2 text-[15px] lg:text-[17px] font-bold text-slate-500">
                      <img
                        src="/images/sheild.svg"
                        alt="Guarantee"
                        className="w-4 lg:w-5 opacity-75"
                      />
                      Results Guaranteed *
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          id="pricing"
          className="py-20 lg:py-24 bg-white border-y border-slate-200"
        >
          <div className="container mx-auto px-6 max-w-[90rem]">
            <div className="text-center mb-14 lg:mb-16">
              <div className="inline-block font-bold text-[15px] lg:text-[16px] uppercase tracking-wider mb-6">
                🚀{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%]">
                  Get up to 3,000 followers / month
                </span>
              </div>
              <h2 className="text-5xl md:text-[48px] lg:text-[63px] font-black text-slate-900 mb-8 tracking-tight">
                Affordable pricing, pick a plan for you
              </h2>

              {/* Custom Text Toggle */}
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`text-[21px] lg:text-[24px] font-black tracking-wide transition-all ${
                    isAnnual
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Annually
                </button>

                <div className="w-px h-6 bg-slate-300"></div>

                <button
                  onClick={() => setIsAnnual(false)}
                  className={`text-[21px] lg:text-[24px] font-black tracking-wide transition-all ${
                    !isAnnual
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Guarantee Text Underneath */}
              {isAnnual && (
                <div className="text-[15px] lg:text-[16px] font-medium text-slate-500 mt-4">
                  60-day money back guarantee, prorated refund for unused time
                  if unhappy
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* MANAGED PLAN */}
              <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col">
                <div className="bg-slate-100 text-slate-600 text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4">
                  Fully Managed
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-black text-slate-900 mb-1">
                  Managed
                </h3>
                <p className="text-slate-500 mb-6 font-medium text-[16px] lg:text-[17px]">
                  750-3,000 Followers / Mo.*
                </p>

                <div className="flex items-baseline mb-2">
                  <span className="text-5xl lg:text-[48px] font-black text-slate-900">
                    ${isAnnual ? "225" : "299"}
                  </span>
                  <span className="text-slate-500 font-medium ml-1 text-[16px] lg:text-[17px]">
                    /mo
                  </span>
                </div>

                <div className="min-h-[3rem] mb-4">
                  {isAnnual ? (
                    <>
                      <div className="text-[15px] lg:text-[16px] font-bold text-[#ff2429] mb-1">
                        Save 25%
                      </div>
                      <div className="text-[15px] lg:text-[16px] text-slate-500 font-medium">
                        $2,691 Paid Annually
                      </div>
                    </>
                  ) : (
                    <div className="text-[15px] lg:text-[16px] text-slate-400 font-medium mt-1">
                      Paid Monthly
                    </div>
                  )}
                </div>

                <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
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
                      className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                    >
                      <img
                        src="/images/tick.svg"
                        alt="Check"
                        className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                {/* MANAGED PLAN DYNAMIC STRIPE LINK */}
                <a
                  href={
                    isAnnual
                      ? getStripeUrl(
                          "https://buy.stripe.com/aEU5mc9yV6ZDgZq00g",
                        )
                      : getStripeUrl(
                          "https://buy.stripe.com/9AQbKAaCZ6ZD4cE3cr",
                        )
                  }
                  className="w-full text-center bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[17px] border border-slate-200"
                >
                  Start my growth
                </a>
              </div>

              {/* MAX PLAN */}
              <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col">
                <div className="bg-[#ffefe9] text-[#ff2429] text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4">
                  Fastest Growth
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-black text-slate-900 mb-1">
                  Max
                </h3>
                <p className="text-slate-500 mb-6 font-medium text-[16px] lg:text-[17px]">
                  500-2,000 Followers / Mo.*
                </p>

                <div className="flex items-baseline mb-2">
                  <span className="text-5xl lg:text-[48px] font-black text-slate-900">
                    ${isAnnual ? "149" : "199"}
                  </span>
                  <span className="text-slate-500 font-medium ml-1 text-[16px] lg:text-[17px]">
                    /mo
                  </span>
                </div>

                <div className="min-h-[3rem] mb-4">
                  {isAnnual ? (
                    <>
                      <div className="text-[15px] lg:text-[16px] font-bold text-[#ff2429] mb-1">
                        Save 25%
                      </div>
                      <div className="text-[15px] lg:text-[16px] text-slate-500 font-medium">
                        $1,791 Paid Annually
                      </div>
                    </>
                  ) : (
                    <div className="text-[15px] lg:text-[16px] text-slate-400 font-medium mt-1">
                      Paid Monthly
                    </div>
                  )}
                </div>

                <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
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
                      className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                    >
                      <img
                        src="/images/tick.svg"
                        alt="Check"
                        className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                {/* MAX PLAN DYNAMIC STRIPE LINK */}
                <a
                  href={
                    isAnnual
                      ? getStripeUrl(
                          "https://buy.stripe.com/7sI3e48uR1Fj10s14b",
                        )
                      : getStripeUrl(
                          "https://buy.stripe.com/6oE7uk7qN1Fj7oQ28d",
                        )
                  }
                  className="w-full text-center bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[17px] border border-slate-200"
                >
                  Start my growth
                </a>
              </div>

              {/* PRO PLAN (HIGHLIGHTED - FULL GRADIENT) */}
              <div className="bg-gradient-to-b from-[#ffae07] via-[#ff2429] to-[#f1078d] text-white rounded-3xl p-6 lg:p-7 shadow-xl flex flex-col transform lg:-translate-y-4 relative z-10 border border-white/20">
                <div className="bg-white/20 backdrop-blur-sm text-white text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4 shadow-sm border border-white/10">
                  Most Popular
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-black mb-1 text-white">
                  Pro
                </h3>
                <p className="text-white/80 mb-6 font-medium text-[16px] lg:text-[17px]">
                  250-1,000 Followers / Mo.*
                </p>

                <div className="flex items-baseline mb-2">
                  <span className="text-5xl lg:text-[48px] font-black text-white">
                    ${isAnnual ? "112" : "149"}
                  </span>
                  <span className="text-white/80 font-medium ml-1 text-[16px] lg:text-[17px]">
                    /mo
                  </span>
                </div>

                <div className="min-h-[3rem] mb-4">
                  {isAnnual ? (
                    <>
                      <div className="text-[15px] lg:text-[16px] font-bold text-[#ffeb3b] mb-1">
                        Save 25%
                      </div>
                      <div className="text-[15px] lg:text-[16px] text-white/90 font-medium">
                        $1,341 Paid Annually
                      </div>
                    </>
                  ) : (
                    <div className="text-[15px] lg:text-[16px] text-white/70 font-medium mt-1">
                      Paid Monthly
                    </div>
                  )}
                </div>

                <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
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
                      className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-white leading-tight"
                    >
                      <svg
                        width="20"
                        height="16"
                        viewBox="0 0 21 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white shrink-0 mt-0.5"
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
                {/* PRO PLAN DYNAMIC STRIPE LINK */}
                <a
                  href={
                    isAnnual
                      ? getStripeUrl(
                          "https://buy.stripe.com/28odSIh1n1Fj8sUfZ6",
                        )
                      : getStripeUrl(
                          "https://buy.stripe.com/6oE7uk5iFdo14cEfYY",
                        )
                  }
                  className="w-full text-center bg-white text-[#ff2429] py-3.5 rounded-xl font-black hover:bg-slate-50 transition-colors text-[17px] shadow-lg"
                >
                  Start my growth
                </a>
              </div>

              {/* STANDARD PLAN */}
              <div className="bg-white rounded-3xl p-6 lg:p-7 border border-slate-200 shadow-sm flex flex-col">
                <div className="bg-slate-100 text-slate-600 text-[13px] lg:text-[15px] font-bold uppercase tracking-widest py-1.5 px-3 rounded-md self-start mb-4">
                  Most Affordable
                </div>
                <h3 className="text-[26px] lg:text-[32px] font-black text-slate-900 mb-1">
                  Standard
                </h3>
                <p className="text-slate-500 mb-6 font-medium text-[16px] lg:text-[17px]">
                  150-500 Followers / Mo.*
                </p>

                <div className="flex items-baseline mb-2">
                  <span className="text-5xl lg:text-[48px] font-black text-slate-900">
                    ${isAnnual ? "75" : "99"}
                  </span>
                  <span className="text-slate-500 font-medium ml-1 text-[16px] lg:text-[17px]">
                    /mo
                  </span>
                </div>

                <div className="min-h-[3rem] mb-4">
                  {isAnnual ? (
                    <>
                      <div className="text-[15px] lg:text-[16px] font-bold text-[#ff2429] mb-1">
                        Save 25%
                      </div>
                      <div className="text-[15px] lg:text-[16px] text-slate-500 font-medium">
                        $891 Paid Annually
                      </div>
                    </>
                  ) : (
                    <div className="text-[15px] lg:text-[16px] text-slate-400 font-medium mt-1">
                      Paid Monthly
                    </div>
                  )}
                </div>

                <ul className="space-y-3 lg:space-y-3.5 mb-8 flex-1">
                  {isAnnual
                    ? [
                        "100% Organic Growth",
                        "Real Followers (No Bots)",
                        "Increased Engagement",
                        "Personal Account Manager",
                        "Quick-Start Results",
                      ].map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                        >
                          <img
                            src="/images/tick.svg"
                            alt="Check"
                            className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                          />
                          {feature}
                        </li>
                      ))
                    : [
                        "100% Organic Growth",
                        "Real Followers (No Bots)",
                        "Increased Engagement",
                        "Email Support",
                      ].map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-[16px] lg:text-[17px] font-bold text-slate-700 leading-tight"
                        >
                          <img
                            src="/images/tick.svg"
                            alt="Check"
                            className="w-5 h-5 lg:w-5 lg:h-5 shrink-0"
                          />
                          {feature}
                        </li>
                      ))}
                </ul>
                {/* STANDARD PLAN DYNAMIC STRIPE LINK */}
                <a
                  href={
                    isAnnual
                      ? getStripeUrl(
                          "https://buy.stripe.com/8wM8yo4eBfw9bF614d",
                        )
                      : getStripeUrl(
                          "https://buy.stripe.com/aEUeWMbH3fw9cJa7st",
                        )
                  }
                  className="w-full text-center bg-slate-100 text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors text-[17px] border border-slate-200 mt-auto"
                >
                  Start my growth
                </a>
              </div>
            </div>
            <p className="text-center text-slate-500 mt-10 text-[15px] lg:text-[16px] font-medium mb-12">
              * Listed growth figures based on avg. client results. Results may
              vary depending on your niche and content
            </p>
          </div>
        </section>

        {/* BLOG SECTION */}
        <section className="py-20 lg:py-24 bg-[#fafafa]">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 lg:mb-12 gap-4">
              <div>
                <h2 className="text-[32px] md:text-5xl lg:text-[48px] font-black text-slate-900 tracking-tight">
                  Explore Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d]">
                    Articles
                  </span>{" "}
                  and Insights.
                </h2>
              </div>
              <Link
                to="/blog"
                className="bg-slate-900 text-white px-5 py-2.5 lg:px-6 lg:py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors text-[17px] lg:text-[18px] whitespace-nowrap shadow-md"
              >
                View All Blogs
              </Link>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* LEFT: Featured Article */}
              <Link
                to="/blog/does-instagram-growth-actually-work-in-2026"
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col group cursor-pointer hover:shadow-md transition-shadow"
              >
                <img
                  src="/images/b1.avif"
                  alt="Does Instagram Growth Actually Work in 2026?"
                  className="w-full h-56 lg:h-[300px] object-cover"
                />
                <div className="p-6 lg:p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[15px] lg:text-[16px] text-slate-500 font-bold mb-3 uppercase tracking-wider">
                    <img
                      src="/images/calendar.png"
                      alt="Date"
                      className="w-4 lg:w-5"
                    />{" "}
                    January 02, 2026
                  </div>
                  <h3 className="text-[26px] lg:text-5xl font-black text-slate-900 mb-3 group-hover:text-[#f80d5d] transition-colors leading-tight">
                    Does Instagram Growth Actually Work in 2026?
                  </h3>
                  <p className="text-slate-600 text-[17px] lg:text-[18px] mb-6 leading-relaxed">
                    From Algorithm Myths to Real Growth: Instagram Strategies
                    That Work in 2026
                  </p>
                  <div className="text-[#f80d5d] font-bold text-[17px] lg:text-[18px] flex items-center gap-2 mt-auto">
                    Read More{" "}
                    <span className="text-xl lg:text-[24px] group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </Link>

              {/* RIGHT: Stacked Standard Articles */}
              <div className="flex flex-col gap-4 lg:gap-6">
                {/* Stacked Article 1 */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-row items-center group cursor-pointer hover:shadow-md transition-shadow p-3 lg:p-4 gap-4 lg:gap-6">
                  <img
                    src="/images/b2.avif"
                    alt="Is Organic Instagram Growth Better Than Ads?"
                    className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex flex-col justify-center py-2 pr-2">
                    <div className="flex items-center gap-2 text-[13px] lg:text-[15px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                      <img
                        src="/images/calendar.png"
                        alt="Date"
                        className="w-3.5 lg:w-4"
                      />{" "}
                      March 13, 2026
                    </div>
                    <h3 className="text-[18px] lg:text-[23px] font-black text-slate-900 mb-2 group-hover:text-[#f80d5d] transition-colors leading-snug">
                      Is Organic Instagram Growth Better Than Ads?
                    </h3>
                    <div className="text-[#f80d5d] font-bold text-[15px] lg:text-[17px] flex items-center gap-1.5">
                      Read More{" "}
                      <span className="text-[18px] lg:text-[21px]">→</span>
                    </div>
                  </div>
                </div>

                {/* Stacked Article 2 */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-row items-center group cursor-pointer hover:shadow-md transition-shadow p-3 lg:p-4 gap-4 lg:gap-6">
                  <img
                    src="/images/b3.avif"
                    alt="How Long Does Instagram Growth Actually Take?"
                    className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex flex-col justify-center py-2 pr-2">
                    <div className="flex items-center gap-2 text-[13px] lg:text-[15px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                      <img
                        src="/images/calendar.png"
                        alt="Date"
                        className="w-3.5 lg:w-4"
                      />{" "}
                      March 13, 2026
                    </div>
                    <h3 className="text-[18px] lg:text-[23px] font-black text-slate-900 mb-2 group-hover:text-[#f80d5d] transition-colors leading-snug">
                      How Long Does Instagram Growth Actually Take?
                    </h3>
                    <div className="text-[#f80d5d] font-bold text-[15px] lg:text-[17px] flex items-center gap-1.5">
                      Read More{" "}
                      <span className="text-[18px] lg:text-[21px]">→</span>
                    </div>
                  </div>
                </div>

                {/* Stacked Article 3 */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-row items-center group cursor-pointer hover:shadow-md transition-shadow p-3 lg:p-4 gap-4 lg:gap-6">
                  <img
                    src="/images/b4.avif"
                    alt="Instagram Growth Services Explained: What You Should Know"
                    className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex flex-col justify-center py-2 pr-2">
                    <div className="flex items-center gap-2 text-[13px] lg:text-[15px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                      <img
                        src="/images/calendar.png"
                        alt="Date"
                        className="w-3.5 lg:w-4"
                      />{" "}
                      March 13, 2026
                    </div>
                    <h3 className="text-[18px] lg:text-[23px] font-black text-slate-900 mb-2 group-hover:text-[#f80d5d] transition-colors leading-snug">
                      Instagram Growth Services Explained: What You Should Know
                    </h3>
                    <div className="text-[#f80d5d] font-bold text-[15px] lg:text-[17px] flex items-center gap-1.5">
                      Read More{" "}
                      <span className="text-[18px] lg:text-[21px]">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section
          id="faq"
          className="py-20 lg:py-24 bg-white border-y border-slate-200"
        >
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-12 lg:mb-16 flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#ffefe9] text-[#f80d5d] mb-6 shadow-sm border border-[#fda6e1]/30">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="text-5xl md:text-[48px] lg:text-[63px] font-black text-slate-900 mb-4 lg:mb-6 tracking-tight">
                Frequently asked questions
              </h2>
              <p className="text-[21px] lg:text-[24px] text-slate-600 max-w-xl mx-auto">
                Still have questions? Reach out to us on live chat or{" "}
                <a
                  href="mailto:support@virallized.com"
                  className="text-[#f80d5d] font-bold hover:underline transition-all"
                >
                  email us
                </a>{" "}
                to get answers to questions not listed here.
              </p>
            </div>

            <div className="space-y-3 lg:space-y-4 border-t border-slate-100 pt-6 lg:pt-8">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center py-4 lg:py-5 text-left transition-colors focus:outline-none group"
                  >
                    <span
                      className={`text-[20px] lg:text-[21px] font-bold pr-8 transition-colors ${activeFaq === index ? "text-[#f80d5d]" : "text-slate-900 group-hover:text-[#f80d5d]"}`}
                    >
                      {faq.q}
                    </span>
                    <div
                      className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                        activeFaq === index
                          ? "bg-gradient-to-r from-[#ffae07] via-[#ff2429] to-[#f1078d] border-transparent text-white rotate-180 shadow-md"
                          : "bg-white border-slate-200 text-slate-400 group-hover:border-[#f80d5d] group-hover:text-[#f80d5d]"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 lg:w-5 lg:h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  <div
                    className={`text-slate-600 text-[17px] lg:text-[18px] leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${
                      activeFaq === index
                        ? "max-h-96 pb-5 lg:pb-6 opacity-100"
                        : "max-h-0 pb-0 opacity-0"
                    }`}
                  >
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="bg-[#fff1f2] py-16 lg:py-24 relative overflow-hidden">
          {/* Background Decorative Blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fda6e1] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ffefe9] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

          <div className="container mx-auto px-6 max-w-6xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-12">
            {/* Left Text Content */}
            <div className="max-w-xl text-left">
              <h2 className="text-2xl md:text-3xl lg:text-[2.6rem] font-black text-slate-900 mb-4 lg:mb-6 tracking-tight leading-tight">
                Get real, organic, and targeted Instagram followers today!
              </h2>
              <p className="text-sm lg:text-base text-slate-600 mb-6 lg:mb-8 leading-relaxed max-w-md">
                Get started with the #1 Instagram Growth Service today and watch
                your account sky-rocket!
              </p>
              <div className="flex flex-row items-center gap-5 lg:gap-6">
                {window.location.pathname === "/" ? (
                  <a
                    href="#pricing"
                    className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold hover:opacity-90 transition-opacity text-[13px] lg:text-sm shadow-md whitespace-nowrap"
                  >
                    Start my growth today
                  </a>
                ) : (
                  <Link
                    to="/#pricing"
                    className="bg-gradient-to-r from-[#ffae07] from-[0%] via-[#ff2429] via-[25%] to-[#f1078d] to-[85%] text-white px-6 py-3 lg:px-8 lg:py-4 rounded-xl font-bold hover:opacity-90 transition-opacity text-[13px] lg:text-sm shadow-md whitespace-nowrap"
                  >
                    Start my growth today
                  </Link>
                )}
                <div className="flex items-center gap-2 text-[11px] lg:text-xs font-bold text-slate-500">
                  <img
                    src="/images/sheild.svg"
                    alt="Guarantee"
                    className="w-3.5 lg:w-4 opacity-75"
                  />
                  Results Guaranteed *
                </div>
              </div>
            </div>

            {/* Right Image Content */}
            <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-center lg:items-end">
              <div className="flex gap-3 lg:gap-4 mb-5 lg:mb-6">
                <div className="bg-white rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 flex items-center gap-2 text-slate-700 font-bold text-[11px] lg:text-[13px] border border-slate-100 shadow-sm">
                  <svg
                    width="14"
                    height="11"
                    viewBox="0 0 21 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 lg:w-auto lg:h-auto"
                  >
                    <defs>
                      <linearGradient
                        id="checkGrad"
                        x1="0"
                        y1="8"
                        x2="21"
                        y2="8"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor="#ffae07" />
                        <stop offset="45%" stopColor="#ff2429" />
                        <stop offset="100%" stopColor="#f1078d" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                      fill="url(#checkGrad)"
                    />
                  </svg>
                  No Bots
                </div>
                <div className="bg-white rounded-lg px-3 py-1.5 lg:px-4 lg:py-2 flex items-center gap-2 text-slate-700 font-bold text-[11px] lg:text-[13px] border border-slate-100 shadow-sm">
                  <svg
                    width="14"
                    height="11"
                    viewBox="0 0 21 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 lg:w-auto lg:h-auto"
                  >
                    <path
                      d="M6.67368 12.6234L1.69528 7.64802L0 9.33035L6.67368 16L21 1.68233L19.3167 0L6.67368 12.6234Z"
                      fill="url(#checkGrad)"
                    />
                  </svg>
                  No Fake Followers
                </div>
              </div>
              <img
                src="/images/fcta.avif"
                alt="Devices"
                className="w-full max-w-[320px] lg:max-w-[420px] object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-white text-slate-500 py-12 lg:py-16 border-t border-slate-200">
          <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-start gap-10 lg:gap-12">
            <div className="flex flex-col md:flex-row gap-12 lg:gap-16 w-full md:w-1/2">
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                  Product
                </div>
                <a
                  href="#how-it-works"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  FAQ
                </a>
              </div>

              {/* LEGAL SECTION */}
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                  Legal
                </div>
                <Link
                  to="/terms-of-service"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Terms of service
                </Link>
                <Link
                  to="/privacy-policy"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Privacy policy
                </Link>
              </div>

              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                  Contact
                </div>
                <a
                  href="mailto:support@virallized.com"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Email us
                </a>
              </div>
            </div>

            <div className="w-full md:w-1/3 flex flex-col items-start md:items-end text-left md:text-right mt-6 md:mt-0">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized"
                className="w-32 lg:w-40 mb-3 lg:mb-4"
              />
              <p className="text-[12px] lg:text-sm font-medium text-slate-500 max-w-[280px] lg:max-w-xs">
                The #1 Instagram Growth Service in the U.S., helping clients
                grow faster on Instagram
              </p>
            </div>
          </div>
          <div className="container mx-auto px-6 max-w-7xl mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-slate-100 flex justify-center text-[12px] lg:text-sm font-medium">
            © Virallized 2026. All Rights Reserved
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
