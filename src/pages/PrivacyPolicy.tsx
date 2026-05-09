import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const PrivacyPolicy = () => {
  // --- REPEATING LEGAL DATA ARRAYS ---
  // The provided privacy policy has identical uses, sources, and consequences for all data types.
  // Using arrays keeps the code extremely clean and easy to update in the future!

  const dataCategories = [
    "Identifying information - Name",
    "Identifying information - Postal / Shipping address",
    "Identifying information - Billing address",
    "Identifying information - Phone number",
    "Identifying information - IP address",
    "Identifying information - Email address",
    "Financial information - Card expiration date",
    "Financial information - Credit card or debit card number",
    "Financial information - Card CVV (security code)",
    "Internet or other electronic activity - Browsing history",
    "Internet or other electronic activity - Search history",
    "Internet or other electronic activity - Information regarding your interaction with our website or application",
  ];

  const legalBases = [
    "The user has provided consent to the processing of their information;",
    "Processing is necessary to perform a contract with the user;",
    "Processing is necessary in order to take steps that the user has requested prior to entering into a contract;",
    "Processing is necessary for compliance with a legal obligation;",
    "Processing is necessary to protect the vital interests of the user or of another person.",
  ];

  const dataSources = [
    "Information submitted by the consumer;",
    "Social networks;",
    "Tracking pixels;",
    "The observation and recording of activities by the business, such as through the use of cookies.",
  ];

  const dataUses = [
    "Analytics;",
    "Auditing compliance;",
    "Auditing transactions that the consumer has entered into;",
    "Counting ad impressions to unique visitors;",
    "Creating new features;",
    "Debugging to identify and repair errors;",
    "Detecting security incidents;",
    "Enforcing our Terms of Service;",
    "Marketing and advertising;",
    "Participation in surveys and contests;",
    "Performing services;",
    "Processing or fulfilling orders or transactions;",
    "Processing payments;",
    "Protecting against malicious, deceptive, fraudulent or illegal activity, and prosecuting those responsible for such activities;",
    "Providing customer service;",
    "Resolving disputes;",
    "Short-term transient use;",
    "Undertaking activities to verify or maintain the quality or safety of our services or devices;",
    "Undertaking internal research for technological development and demonstration;",
    "Verifying customer information;",
    "Verifying position and quality of ad impressions.",
  ];

  const dataConsequences = [
    "Our use of your data for analytics will not be possible;",
    "Our use of your data for auditing compliance will not be possible;",
    "Our use of your data for auditing transactions that the consumer has entered into will not be possible;",
    "Our use of your data for counting ad impressions to unique visitors will not be possible;",
    "Our use of your data for creating new features will not be possible;",
    "Our use of your data for debugging to identify and repair errors will not be possible;",
    "Our use of your data for detecting security incidents will not be possible;",
    "Our use of your data for enforcing our Terms of Service will not be possible;",
    "Our use of your data for marketing and advertising will not be possible;",
    "Our use of your data for participation in surveys and contests will not be possible;",
    "Our use of your data for performing services will not be possible;",
    "Our use of your data for processing or fulfilling orders or transactions will not be possible;",
    "Our use of your data for processing payments will not be possible;",
    "Our use of your data for protecting against malicious, deceptive, fraudulent or illegal activity, and prosecuting those responsible for such activities will not be possible;",
    "Our use of your data for providing customer service will not be possible;",
    "Our use of your data for resolving disputes will not be possible;",
    "Our use of your data for short-term transient use will not be possible;",
    "Our use of your data for undertaking activities to verify or maintain the quality or safety of our services or devices will not be possible;",
    "Our use of your data for undertaking internal research for technological development and demonstration will not be possible;",
    "Our use of your data for verifying customer information will not be possible;",
    "Our use of your data for verifying position and quality of ad impressions will not be possible.",
  ];

  const userRights = [
    {
      right: "The right to access your information.*",
      applies:
        "Residents of Canada, the European Union, and the United Kingdom only",
    },
    {
      right: "The right to say no to the sale of your personal information.",
      applies: "Residents of Nevada only",
    },
    {
      right:
        "The right to request that we delete all or some of the personal information that we have collected on you.*",
      applies: "Residents of the European Union and the United Kingdom only",
    },
    {
      right:
        "The right to ask us to transmit your personal information that we have collected on you to another provider (where technically feasible).*",
      applies: "Residents of the European Union and the United Kingdom only",
    },
    {
      right:
        "Rectification of information: the right to request that we amend any of the information that we have collected about you.*",
      applies:
        "Residents of Canada, the European Union, and the United Kingdom only",
    },
    {
      right:
        "The right to withdraw your consent to the processing of your data.*",
      applies:
        "Residents of Canada, the European Union, and the United Kingdom only",
    },
    {
      right:
        "The right to request that we restrict the processing of your data.*",
      applies: "Residents of the European Union and the United Kingdom only",
    },
    {
      right:
        "The right to lodge a complaint regarding our collection, sharing and processing of data with competent authorities in the proper jurisdiction.*",
      applies: "Residents of Canada and the European Union only",
    },
    {
      right:
        "The right to lodge a complaint regarding our collection, sharing and processing of data with the Information Commissioner's Office or any other competent authority.*",
      applies: "Residents of the United Kingdom only",
    },
  ];

  return (
    <>
      <SEO
        title="Privacy Policy | Virallized"
        description="Read the Virallized Privacy Policy to learn how we collect, use, protect, and manage personal information when you use our website and services."
        path="/privacy-policy"
      />

      <div className="min-h-screen bg-[#fafafa] font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
        {/* SIMPLIFIED NAVBAR */}
        <nav className="bg-white border-b border-slate-200 py-4 relative z-20">
          <div className="container mx-auto px-6 lg:px-20 xl:px-24 max-w-[90rem] flex justify-between items-center">
            <Link to="/" className="w-36 md:w-44">
              <img
                src="/images/logos/virallized-main-logo.svg"
                alt="Virallized Logo"
                className="w-full h-auto"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8 font-bold text-slate-600 text-[12px] lg:text-[13px] tracking-wide">
              <a
                href="/#how-it-works"
                className="hover:text-[#ff2429] transition-colors"
              >
                How it works
              </a>
              <a
                href="/#pricing"
                className="hover:text-[#ff2429] transition-colors"
              >
                Pricing
              </a>
              <a
                href="/blog"
                className="hover:text-[#ff2429] transition-colors"
              >
                Blog
              </a>
              <a
                href="/#pricing"
                className="text-[#ff2429] hover:text-[#f80d5d] transition-colors"
              >
                Get Started
              </a>
            </div>

            <button className="md:hidden p-2 text-slate-900 focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
        </nav>

        {/* MAIN LEGAL CONTENT */}
        <main className="container mx-auto px-6 py-12 lg:py-20 max-w-4xl">
          <div className="bg-white rounded-3xl p-8 md:p-12 lg:p-16 border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="border-b border-slate-100 pb-8 mb-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Virallized Privacy Policy
              </h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                Last updated: 2021-01-05 04:32:43
              </p>
            </div>

            <div className="text-sm md:text-base text-slate-600 leading-relaxed space-y-6">
              <p>
                We value your privacy very highly. Please read this Privacy
                Policy carefully before using the virallized.com Website (the
                "Website") operated by Virallized, a(n) Sole Proprietorship
                formed in New York, United States ("us," "we," "our") as this
                Privacy Policy contains important information regarding your
                privacy and how we may use the information we collect about you.
              </p>
              <p>
                Your access to and use of the Website is conditional upon your
                acceptance of and compliance with this Privacy Policy. This
                Privacy Policy applies to everyone, including, but not limited
                to: visitors, users, and others, who wish to access or use the
                Website.
              </p>
              <p>
                By accessing or using the Website, you agree to be bound by this
                Privacy Policy. If you disagree with any part of the Privacy
                Policy, then you do not have our permission to access or use the
                Website.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                What information we collect, where we get this information from,
                how we use this information, what happens if we don't have it,
                and the legal basis for processing this information
              </h2>

              {/* DYNAMIC DATA COLLECTION BLOCKS */}
              <div className="space-y-8 mt-6">
                {dataCategories.map((category, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-6 lg:p-8"
                  >
                    <h3 className="text-lg font-black text-[#f80d5d] mb-6 pb-4 border-b border-slate-200/60">
                      {category}
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          Legal basis for processing this information:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                          {legalBases.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          Where we get this information from:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                          {dataSources.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          How we use this information:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                          {dataUses.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          What happens if we don't have this information:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                          {dataConsequences.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                With whom we share your information
              </h2>
              <p>
                We do not share your personal information with any third
                parties.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                How we protect your information
              </h2>
              <p>
                We have implemented the following measures to protect and
                safeguard your personal information:
              </p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-slate-700">
                <li>
                  Limiting the amount of personal information that we collect to
                  strictly necessary only;
                </li>
                <li>
                  Using SSL or other secure connection technologies when
                  receiving or sending personal information beyond internal
                  networks;
                </li>
                <li>
                  Destroying the personal information that we no longer need;
                </li>
                <li>Performing regular risk assessments;</li>
                <li>Mitigating risks by following a risk treatment plan;</li>
                <li>Having comprehensive security policies and procedures;</li>
                <li>
                  Screening all employees with access to personal information;
                </li>
                <li>Training our employees;</li>
                <li>
                  Requiring our employees to sign confidentiality agreements;
                </li>
                <li>Encrypting laptops, USBs and other portable media;</li>
                <li>
                  Implementing and monitoring intrusion prevention and detection
                  systems;
                </li>
                <li>Maintaining up-to-date software and safeguards;</li>
                <li>Performing regular due diligence of vendors;</li>
                <li>Implementing physical security measures;</li>
                <li>
                  Physically and/or logically separating systems containing
                  personal information from public networks such as the
                  internet.
                </li>
              </ul>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Cookies
              </h2>
              <p>
                A cookie is a small piece of data sent from a website and stored
                on your computer by your web browser. The file is added once you
                agree to store cookies on your computer or device, and the
                cookie helps analyze web traffic or lets you know when you visit
                a particular site. Cookies allow sites to respond to you as an
                individual. The Website can also tailor its operations to your
                needs, likes, and dislikes by gathering and remembering
                information about your preferences.
              </p>
              <p>
                This Website collects cookies and may use cookies for reasons
                including, but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-2 font-medium text-slate-700">
                <li>Analyze our web traffic using an analytics package;</li>
                <li>Identify if you are signed in to the Website;</li>
                <li>Test content on the Website;</li>
                <li>Store information about your preferences;</li>
                <li>Recognize when you return to the Website.</li>
              </ul>
              <p>
                Overall, cookies help us provide you with a better Website, by
                enabling us to monitor which pages you find useful and which you
                do not. A cookie in no way gives us access to your computer or
                any information about you, other than the data you choose to
                share with us.
              </p>
              <p>
                You can accept or decline cookies. Most web browsers
                automatically accept cookies, but you can modify your browser
                setting to decline cookies if you prefer. This setting may
                prevent you from taking full advantage of the Website.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Children's Privacy
              </h2>
              <p>
                This Website is intended for use by a general audience and does
                not offer services to children. Should a child whom we know to
                be under 18 send personal information to us, we will use that
                information only to respond to that child to inform him or her
                that they cannot use this Website.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Analytics Programs
              </h2>
              <p>
                This Website uses Google Analytics to collect information about
                you and your behaviors. If you would like to opt out of Google
                Analytics, please visit{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f80d5d] hover:underline"
                >
                  https://tools.google.com/dlpage/gaoptout/
                </a>
                .
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Information Retention
              </h2>
              <p>
                We retain all of the information that we collect for a period of
                999 years.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Your rights
              </h2>
              <p>
                Depending upon where you reside, you may have the following
                rights with regard to your personal information.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {userRights.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between"
                  >
                    <p className="font-bold text-slate-900 text-sm mb-3">
                      {item.right}
                    </p>
                    <p className="text-[11px] font-bold text-[#f80d5d] uppercase tracking-wider mt-auto border-t border-slate-200/60 pt-3">
                      Applies To:{" "}
                      <span className="text-slate-500 normal-case block mt-1">
                        {item.applies}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm italic">
                *You may exercise these rights at any time by emailing us at{" "}
                <a
                  href="mailto:contact@virallized.com"
                  className="text-[#f80d5d] hover:underline not-italic font-bold"
                >
                  contact@virallized.com
                </a>
                . Please note that we may ask you to verify your identity before
                we can exercise any of these rights.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Exercising your rights
              </h2>
              <p>
                Residents of Canada may exercise the rights specified above by
                submitting a consumer request to the person accountable for our
                privacy practices and policies, whose contact information is
                below.
              </p>
              <p>
                We will need to verify your identity prior to effectuating your
                request. To verify your identity, you will need to provide us
                with the following information with your request: Name; Email
                address.
              </p>
              <p>
                Please note that we may be unable to process your request if you
                do not provide us with the above information.
              </p>
              <p>
                We will respond to most consumer requests within 30 days of
                receipt. However, some requests may take longer. We will notify
                you in writing if we need more time to respond (up to an
                additional 30 days). We have the ability to deny your request(s)
                if certain exceptions in the law apply. If we do deny your
                request(s), we will provide you with the reasons for such
                denials.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Accountability
              </h2>
              <p>
                The following person is accountable and responsible for our
                privacy practices and procedures:
              </p>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 inline-block mt-2 mb-4">
                <p className="font-bold text-slate-900">Mr. Jawad</p>
                <p>+61405299883</p>
                <a
                  href="mailto:contact@virallized.com"
                  className="text-[#f80d5d] hover:underline"
                >
                  contact@virallized.com
                </a>
              </div>
              <p>
                You may lodge a complaint with us by contacting the person
                accountable and responsible for our privacy practices and
                procedures at the contact information above. You may also lodge
                a complaint with the Office of the Privacy Commissioner of
                Canada by filling out this form or calling 1-800-282-1376.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Location of data processing
              </h2>
              <p>
                All data processing activities undertaken by us take place in
                Melbourne, Australia.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Do Not Track
              </h2>
              <p>
                Do Not Track is a preference you can set on your browser to
                inform websites that you do not want to be tracked. We do not
                support Do Not Track ("DNT"). You can either enable or disable
                Do Not Track by visiting the Preferences or Settings page of
                your browser.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Transferring Data
              </h2>
              <p>
                We plan to transfer data to Australia. This means that your
                information may be processed in a country outside of Canada and
                it may be accessible to law enforcement authorities and national
                security authorities of that country and jurisdiction.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Changes to Privacy Policy
              </h2>
              <p>
                We reserve the right to amend this Privacy Policy at any time.
                We will notify you of any changes to this Privacy Policy by
                posting the updated Privacy Policy to this Website.
              </p>

              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
                Questions
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <a
                  href="mailto:contact@virallized.com"
                  className="text-[#f80d5d] font-bold hover:underline"
                >
                  contact@virallized.com
                </a>
                .
              </p>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white text-slate-500 py-12 lg:py-16 border-t border-slate-200">
          <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-start gap-10 lg:gap-12">
            <div className="flex flex-col md:flex-row gap-12 lg:gap-16 w-full md:w-1/2">
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                  Product
                </div>
                <a
                  href="/#how-it-works"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  How it works
                </a>
                <a
                  href="/#pricing"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Pricing
                </a>
                <a
                  href="/#faq"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  FAQ
                </a>
              </div>
              <div className="flex flex-col gap-3 lg:gap-4">
                <div className="font-bold text-slate-900 text-[11px] lg:text-sm tracking-wider uppercase mb-1 lg:mb-2">
                  Legal
                </div>
                <a
                  href="/terms-of-service"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Terms of service
                </a>
                <a
                  href="/privacy-policy"
                  className="text-[13px] lg:text-sm font-medium hover:text-blue-600 transition"
                >
                  Privacy policy
                </a>
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
                Virallized is not endorsed or certified by Instagram. All
                Instagram™️ logos and trademarks displayed on this website and
                service are the property of Instagram.
              </p>
            </div>
          </div>
          <div className="container mx-auto px-6 max-w-7xl mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-slate-100 flex justify-center text-[12px] lg:text-sm font-medium">
            Copyright © 2026 Virallized. All Rights Reserved
          </div>
        </footer>
      </div>
    </>
  );
};

export default PrivacyPolicy;
