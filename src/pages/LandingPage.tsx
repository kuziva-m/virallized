import React, { useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    if (activeFaq === index) {
      setActiveFaq(null);
    } else {
      setActiveFaq(index);
    }
  };

  const faqs = [
    {
      q: "How quickly will I start seeing followers?",
      a: "You’ll typically start seeing new followers within 24–72 hours of signing up. Growth ramps up gradually, and most accounts reach full speed within the first 5–7 days, depending on targeting and account activity.",
    },
    {
      q: "Are there any risks in using Soaria?",
      a: "No. Account safety is our top priority. We’ve helped thousands of clients grow on Instagram using organic methods, and none of our clients’ accounts have ever been put at risk. We don’t use bots, fake followers, or aggressive tactics — just real exposure to the right audience.",
    },
    {
      q: "How does Soaria actually grow my Instagram?",
      a: "Soaria works by promoting your profile to real users who are already interested in your niche, content, or industry. This increases genuine discovery and profile visits, allowing people to follow you organically because they’re genuinely interested.",
    },
    {
      q: "Are the followers I gain real people?",
      a: "Yes — every follower gained through Soaria is a real Instagram user. We don’t use bots, fake accounts, or purchased followers. Our system focuses on real exposure, which means the people who follow you do so by choice.",
    },
    {
      q: "Can I choose who my account is targeted to?",
      a: "Absolutely. Your growth is fully tailored to your goals. You can specify niches, locations, interests, competitor accounts, and audience types so your account is shown to people who are most likely to engage with your content.",
    },
    {
      q: "Do you post content or send messages on my behalf?",
      a: "No. Soaria never posts content, comments, or sends DMs on your behalf. Your content, voice, and interactions remain 100% yours — we simply help the right people discover your account organically.",
    },
    {
      q: "Can I cancel my subscription at any time?",
      a: "Yes — you can cancel anytime. There are no contracts or long-term commitments.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* TOP PROMO BANNER */}
      <div className="bg-indigo-600 text-white text-center py-2.5 text-sm font-medium tracking-wide shadow-sm">
        🎉 Get a 50% discount on your first month of Soaria! Enter code{" "}
        <span className="font-bold border-b border-white/50 pb-0.5">50OFF</span>{" "}
        at checkout
      </div>

      {/* NAVBAR */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <Link
            to="/"
            className="text-3xl font-black text-indigo-700 tracking-tighter flex items-center gap-2"
          >
            Soaria<span className="text-pink-500">.</span>
          </Link>
          <div className="hidden md:flex gap-8 font-semibold text-slate-600">
            <a
              href="#how-it-works"
              className="hover:text-indigo-600 transition"
            >
              How it works
            </a>
            <a href="#pricing" className="hover:text-indigo-600 transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-indigo-600 transition">
              FAQ
            </a>
          </div>
        </div>
        <Link
          to="/set-up"
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          Start My Growth
        </Link>
      </nav>

      {/* HERO SECTION */}
      <header className="container mx-auto px-6 pt-24 pb-32 text-center max-w-5xl">
        <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-200 mb-10 transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Account Managers Currently Online
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-slate-900 leading-[1.1] mb-8 tracking-tight">
          Get{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500">
            Real
          </span>
          , Organic
          <br className="hidden md:block" /> Instagram Followers
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
          Get as many as 3,000 real and targeted Instagram followers every month
          that actually like, comment, and engage with your content using our
          AI-driven targeting.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-10 mb-16">
          <div className="flex items-center gap-3 text-slate-800 font-bold bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            Not bots
          </div>
          <div className="flex items-center gap-3 text-slate-800 font-bold bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            No fake followers
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
          <Link
            to="/set-up"
            className="flex-1 bg-indigo-600 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all duration-200 transform hover:-translate-y-1"
          >
            Start My Growth
          </Link>
          <a
            href="#how-it-works"
            className="flex-1 bg-white text-slate-900 border-2 border-slate-200 px-8 py-5 rounded-2xl font-bold text-lg hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
          >
            Learn More
          </a>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-200 flex flex-col items-center">
          <p className="text-slate-400 font-semibold uppercase tracking-widest text-sm mb-8">
            Trusted by over 12,000+ creators and businesses
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-2xl font-black font-serif">Forbes</div>
            <div className="text-2xl font-black font-sans">Entrepreneur</div>
            <div className="text-xl font-bold uppercase tracking-widest">
              Social Media Today
            </div>
            <div className="text-2xl font-black italic">BuzzFeed</div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-white py-32 border-y border-slate-200"
      >
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-24">
            <div className="inline-block bg-indigo-50 text-indigo-700 font-bold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider mb-6">
              🚀 Up to 3,000 followers / month
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              How it works in 3 simple steps
            </h2>
          </div>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 rounded-3xl transform rotate-3 scale-105"></div>
                <div className="bg-white rounded-3xl h-96 w-full border border-slate-100 shadow-xl relative flex flex-col items-center justify-center p-8 overflow-hidden">
                  <div className="w-full flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                    <div className="w-32 h-4 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="w-full grid grid-cols-3 gap-4">
                    <div className="h-24 bg-indigo-50 rounded-xl border-2 border-indigo-100"></div>
                    <div className="h-24 bg-pink-50 rounded-xl border-2 border-pink-100"></div>
                    <div className="h-24 bg-emerald-50 rounded-xl border-2 border-emerald-100"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-indigo-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl mb-8 shadow-lg shadow-indigo-200 transform -rotate-6">
                  1
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                  We find your target audience
                </h3>
                <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                  During setup, you'll tell us your niche, competitors, and
                  ideal follower. We use this data to build a hyper-specific
                  targeting profile for your account.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-tl from-pink-100 to-orange-50 rounded-3xl transform -rotate-3 scale-105"></div>
                <div className="bg-slate-900 rounded-3xl h-96 w-full shadow-xl relative flex flex-col items-center justify-center p-8 overflow-hidden">
                  <div className="w-full flex items-end gap-4 h-full border-b border-slate-800 pb-4">
                    <div className="w-1/4 bg-slate-800 rounded-t-xl h-1/3"></div>
                    <div className="w-1/4 bg-indigo-900 rounded-t-xl h-1/2"></div>
                    <div className="w-1/4 bg-indigo-700 rounded-t-xl h-3/4 relative">
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-pink-500 rounded-full border-4 border-slate-900"></div>
                    </div>
                    <div className="w-1/4 bg-indigo-500 rounded-t-xl h-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-pink-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl mb-8 shadow-lg shadow-pink-200 transform rotate-6">
                  2
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                  We engage on your behalf
                </h3>
                <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                  Our AI engines interact with thousands of users in your target
                  audience every day, driving massive amounts of organic traffic
                  back to your profile.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-3xl transform rotate-3 scale-105"></div>
                <div className="bg-white rounded-3xl h-96 w-full border border-slate-100 shadow-xl relative flex flex-col items-center justify-center p-8 overflow-hidden">
                  <div className="flex flex-col items-center text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <div className="text-4xl font-black text-slate-900 mb-2">
                      + 2,841
                    </div>
                    <div className="text-slate-500 font-bold uppercase tracking-widest text-sm">
                      New Followers This Month
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl mb-8 shadow-lg shadow-emerald-200 transform -rotate-6">
                  3
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
                  You get real followers
                </h3>
                <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                  Because the thousands of people seeing your page actually care
                  about your niche, a high percentage of them will hit follow
                  and engage with your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="py-32 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Don't just take our word for it
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Over 12,000 clients trust Soaria and rave about the high-quality,
              targeted followers we bring to their accounts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <div className="flex text-yellow-400 mb-6">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-lg leading-relaxed text-slate-300 flex-1 mb-8">
                "Thank you Soaria!!!! You are THE go-to for social media growth
                + engagement! I love the results I’ve seen with you! Smart, FAST
                & personable."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xl">
                  AS
                </div>
                <div>
                  <div className="font-bold text-white">@ashlie.m.smith</div>
                  <div className="text-sm text-emerald-400 font-semibold">
                    + 11.6K Followers
                  </div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <div className="flex text-yellow-400 mb-6">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-lg leading-relaxed text-slate-300 flex-1 mb-8">
                "I am so grateful to have found Soaria and their services! They
                helped me grow my account steadily and safely, and I felt
                comfortable trusting the process all the way through."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center font-bold text-xl">
                  SH
                </div>
                <div>
                  <div className="font-bold text-white">@savnhale</div>
                  <div className="text-sm text-emerald-400 font-semibold">
                    + 104K Followers
                  </div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <div className="flex text-yellow-400 mb-6">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
              </div>
              <p className="text-lg leading-relaxed text-slate-300 flex-1 mb-8">
                "Soaria has been such a helpful service in growing my Instagram
                organically. I’ve seen a steady increase in followers who are
                genuinely interested in my content and actually stick around—no
                bots."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-xl">
                  LL
                </div>
                <div>
                  <div className="font-bold text-white">@_leilovesit</div>
                  <div className="text-sm text-emerald-400 font-semibold">
                    + 3.3K Followers
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 bg-slate-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight">
              Affordable pricing, pick a plan for you
            </h2>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-6">
              <span
                className={`font-bold text-lg ${!isAnnual ? "text-slate-900" : "text-slate-400"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-16 h-8 bg-indigo-600 rounded-full relative transition-colors focus:outline-none shadow-inner"
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${isAnnual ? "left-9" : "left-1"}`}
                ></div>
              </button>
              <span
                className={`font-bold text-lg flex items-center gap-3 ${isAnnual ? "text-slate-900" : "text-slate-400"}`}
              >
                Annually{" "}
                <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                  Save 25%
                </span>
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard Plan */}
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-4">
                Most Affordable
              </span>
              <h3 className="text-3xl font-black text-slate-900 mb-2">
                Standard
              </h3>
              <p className="text-slate-500 mb-8 font-medium">
                150-500 Followers / Mo.*
              </p>
              <div className="text-6xl font-black text-slate-900 mb-10 tracking-tighter">
                ${isAnnual ? "75" : "99"}
                <span className="text-xl text-slate-500 font-semibold tracking-normal">
                  /mo
                </span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-start gap-4 font-semibold text-slate-700 leading-snug">
                  <svg
                    className="w-6 h-6 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  100% Organic Growth
                </li>
                <li className="flex items-start gap-4 font-semibold text-slate-700 leading-snug">
                  <svg
                    className="w-6 h-6 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Real Followers (No Bots)
                </li>
                <li className="flex items-start gap-4 font-semibold text-slate-700 leading-snug">
                  <svg
                    className="w-6 h-6 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Email Support
                </li>
              </ul>
              <Link
                to="/set-up?plan=99"
                className="w-full text-center bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-lg"
              >
                Start my growth
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 text-white rounded-3xl p-10 border border-slate-800 shadow-2xl shadow-indigo-900/20 flex flex-col relative transform lg:-translate-y-4 ring-4 ring-indigo-600/20">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
              <h3 className="text-3xl font-black mt-4 mb-2">Pro</h3>
              <p className="text-slate-400 mb-8 font-medium">
                250-1,000 Followers / Mo.*
              </p>
              <div className="text-6xl font-black mb-10 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                ${isAnnual ? "112" : "149"}
                <span className="text-xl text-slate-400 font-semibold tracking-normal">
                  /mo
                </span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-start gap-4 font-semibold text-slate-200 leading-snug">
                  <svg
                    className="w-6 h-6 text-pink-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Everything in Standard
                </li>
                <li className="flex items-start gap-4 font-semibold text-slate-200 leading-snug">
                  <svg
                    className="w-6 h-6 text-pink-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Our Latest AI Technology
                </li>
                <li className="flex items-start gap-4 font-semibold text-slate-200 leading-snug">
                  <svg
                    className="w-6 h-6 text-pink-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Personal Account Manager
                </li>
              </ul>
              <Link
                to="/set-up?plan=149"
                className="w-full text-center bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-500 transition-colors text-lg shadow-lg shadow-indigo-900/50"
              >
                Start my growth
              </Link>
            </div>

            {/* Max Plan */}
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-4">
                Fastest Growth
              </span>
              <h3 className="text-3xl font-black text-slate-900 mb-2">Max</h3>
              <p className="text-slate-500 mb-8 font-medium">
                500-2,000 Followers / Mo.*
              </p>
              <div className="text-6xl font-black text-slate-900 mb-10 tracking-tighter">
                ${isAnnual ? "149" : "199"}
                <span className="text-xl text-slate-500 font-semibold tracking-normal">
                  /mo
                </span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                <li className="flex items-start gap-4 font-semibold text-slate-700 leading-snug">
                  <svg
                    className="w-6 h-6 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Everything in Pro
                </li>
                <li className="flex items-start gap-4 font-semibold text-slate-700 leading-snug">
                  <svg
                    className="w-6 h-6 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Quick-Start Results
                </li>
                <li className="flex items-start gap-4 font-semibold text-slate-700 leading-snug">
                  <svg
                    className="w-6 h-6 text-emerald-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>{" "}
                  Priority Support
                </li>
              </ul>
              <Link
                to="/set-up?plan=199"
                className="w-full text-center bg-slate-100 text-slate-900 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-lg"
              >
                Start my growth
              </Link>
            </div>
          </div>
          <p className="text-center text-slate-500 mt-12 text-sm max-w-2xl mx-auto">
            * Listed growth figures are based on average client results. Actual
            results may vary depending on your specific niche, audience size,
            and content quality.
          </p>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-32 bg-white border-t border-slate-200">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-xl text-slate-600">
              Still have questions? Reach out to us on live chat or{" "}
              <a
                href="mailto:support@soaria.co"
                className="text-indigo-600 font-bold hover:underline"
              >
                email us
              </a>{" "}
              to get answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-left bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                  <span className="text-lg font-bold text-slate-900 pr-8">
                    {faq.q}
                  </span>
                  <svg
                    className={`w-6 h-6 text-slate-500 transform transition-transform duration-200 shrink-0 ${activeFaq === index ? "rotate-180" : ""}`}
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
                </button>
                <div
                  className={`px-6 text-slate-600 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? "max-h-96 py-6 opacity-100" : "max-h-0 py-0 opacity-0"}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
            Get real, organic, and targeted Instagram followers today!
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join thousands of creators using the #1 Instagram Growth Service to
            safely scale their audience.
          </p>
          <Link
            to="/set-up"
            className="inline-block bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-100 shadow-xl shadow-black/50 transition-all duration-200 transform hover:-translate-y-1"
          >
            Start My Growth Today
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tighter">
              Soaria<span className="text-pink-500">.</span>
            </span>
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-white transition">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition">
              Privacy Policy
            </a>
            <a
              href="mailto:support@soaria.co"
              className="hover:text-white transition"
            >
              Contact
            </a>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-8 pt-8 border-t border-slate-900 text-center text-sm">
          © {new Date().getFullYear()} Soaria. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
