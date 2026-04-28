import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
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
            <a href="/blog" className="hover:text-[#ff2429] transition-colors">
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
              Virallized Terms of Service
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Last updated: 23/11/22 11:22
            </p>
          </div>

          <div className="text-sm md:text-base text-slate-600 leading-relaxed space-y-6">
            <p>
              This Internet Web Site Terms and Conditions of Use Agreement (the
              "Terms of Use") is between the party “signing up” and/or using The
              Site ("you") and Virallized ("we" or "us" and collectively the
              "Company" or "Virallized"). You should carefully read the Terms of
              Use before using The Site. By using The Site you agree to be bound
              by the terms and conditions of use set forth in the Terms of Use.
              This is a legally binding agreement. If you do not agree with the
              Terms of Use you should not use The Site and must leave The Site.
            </p>
            <p>
              We agree to provide you access to The Site in accordance with the
              Terms of Use.
            </p>

            <ol className="list-decimal pl-5 space-y-4 font-medium text-slate-700">
              <li>
                Virallized is not associated with or makes claim to be
                affiliated with, authorized, maintained, sponsored or endorsed
                by Instagram, Facebook, TikTok or any of their affiliates or
                subsidiaries.
              </li>
              <li>
                It is your responsibility and yours alone to follow and comply
                with Instagram/Facebook/TikTok rules and guidelines. You agree
                to use Virallized at your own risk and agree to indemnify
                Virallized if your account gets banned, locked up, and any other
                action that Instagram/Facebook does to your account on behalf of
                your actions or using Virallized to build and grow your profile.
                We do not guarantee the amount of followers you will receive and
                if they will be real individuals. We also do not guarantee the
                connection to be stable or permanently connected to Instagram or
                its API at any given time.
              </li>
              <li>
                We are not responsible to keep or store your passwords for
                Virallized or Instagram and the company will not share any
                information of the sort.
              </li>
              <li>
                You agree to contact customer service for a refund if necessary.
                Virallized reserves the right to give you a full or prorated
                refund based on their own discretion. You also agree not to file
                any fraudulent claim to chargeback or dispute charges from
                Virallized. In the event that Virallized is no longer able to
                provide service, Virallized reserve the rights to not give a
                refund and also shut down our service at any time.
              </li>
              <li>
                You agree to use The Site in a manner consistent with the Terms
                of Use and all applicable rules and regulations. You acknowledge
                that you have read the Terms of Use and that you accept the
                terms thereof. You agree to read these terms of use carefully
                before using The Site. If you do not agree to the Terms of Use,
                you may not access or otherwise use The Site.
              </li>
              <li>
                You accept that The Site is provided on an "as is, as available"
                basis.
              </li>
              <li>
                The materials included in The Site are for general information
                purposes only and do not constitute legal advice. They are not
                intended to be a substitute for obtaining legal advice from
                legal counsel.{" "}
                <span className="uppercase">
                  All articles and material displayed by us on the site are for
                  information only, are no substitute for specific advice, and
                  are in no manner to be considered legal advice or other
                  licensed professional advice or a substitute therefor. For
                  specific legal advice regarding your particular circumstances,
                  you must retain legal counsel.
                </span>{" "}
                The Company does not represent or endorse the accuracy or
                reliability of any advice, opinion, statement, or other
                information displayed or distributed through The Site. You
                acknowledge that any reliance upon any such materials, opinion,
                advice, statement, memorandum, or information shall be at your
                sole risk. the Company reserves the right, in its sole
                discretion, to correct any errors or omissions in any portion of
                The Site.
              </li>
              <li className="uppercase">
                Your access to and use of the site may be terminated at any time
                for any reason or for no reason by you or by us.
              </li>
              <li className="uppercase">
                We may, subject to and in accordance with our privacy policy for
                marketing and other purposes, collect, process and transmit
                certain data obtained from and about you in the course of your
                accessing the site. By agreeing to these terms, you agree to
                such data being so used and further agree that it may be
                transmitted to others whether or not within the Philippines or
                Australia in accordance with our privacy policy and under
                applicable privacy and data protection legislation.{" "}
                <span className="normal-case">
                  Information on how and what type of data (if any) is held
                  about you can be obtained by clicking here to review our
                  privacy policy or by contacting us.
                </span>
              </li>
              <li>
                The Site is protected by copyright as a collective work and/or
                compilation, pursuant to U.S. & AU copyright laws, international
                conventions, and other copyright laws. You are authorized to
                download one copy of the material displayed or performed on The
                Site ("Content") on one computer for your personal,
                non-commercial use only but you may not in so doing remove or
                amend any trademark, copyright or other proprietary notice. All
                materials contained on The Site are protected by copyright, and
                are owned or controlled by the Company or the party credited as
                the provider of the Content. You will abide by any and all
                additional copyright notices, information, or restrictions
                contained in any Content on The Site. Permission is given to
                view the material on these web pages and save that material only
                for your personal reference. Copying or storing of any Content
                for other than personal, non-commercial use is expressly
                prohibited without the prior written permission from the Company
                or the copyright holder identified in the individual Content's
                copyright notice. <br />
                <br />
                Subject to the above, you may not modify, copy, distribute,
                republish or upload any of the material on The Site in any way
                unless you obtain the prior written consent of the Company No
                intellectual property or other rights shall be transferred to
                you through your use of The Site. We are not able to confirm
                that the materials contained on these web pages are correct in
                every case. The Company reserves the right to make changes to
                The Site, including the availability of any feature, database,
                Content, Web page materials, product information and prices on
                The Site at any time without notice or liability. The Company
                may also impose limits on certain features and services or
                restrict your access to parts or all of The Site without notice
                or liability.
              </li>
              <li>
                To the extent that any portions of The Site (such as "chat
                rooms" or "bulletin boards") provide users an opportunity to
                post and exchange information, ideas or opinions ("Postings"),{" "}
                <span className="uppercase">
                  Be advised that we do not screen, edit, or review postings
                  prior to their appearance on this web site
                </span>
                , and Postings do not necessarily reflect our views. To the
                fullest extent permitted by applicable laws, we exclude all
                responsibility and liability for the Postings or for any losses
                or expenses resulting from their use and/or appearance on The
                Site.
              </li>
              <li>
                You represent, warrant and covenant that: (a) you shall not
                upload, post or transmit to or distribute or otherwise publish
                through The Site any materials which (i) restrict or inhibit any
                other user from using and enjoying The Site, (ii) are unlawful,
                threatening, abusive, libelous, defamatory, obscene, vulgar,
                offensive, pornographic, profane, sexually explicit or indecent,
                (iii) constitute or encourage conduct that would constitute a
                criminal offense, give rise to civil liability or otherwise
                violate law, (iv) violate, plagiarize or infringe the rights of
                third parties including, without limitation, copyright,
                trademark, patent, rights of privacy or publicity or any other
                proprietary right, (v) contain a virus or other harmful
                component, (vi) contain any information, software or other
                material of a commercial nature, (vii) contain advertising of
                any kind, or (viii) constitute or contain false or misleading
                indications of origin or statements of fact; and (b) that you
                are at least eighteen (18) years old.
              </li>
              <li>
                We reserve the right to monitor all accounts, posts, or other
                materials used on The Site and to remove any which we consider
                in our absolute discretion to be: (a) offensive, (b)
                inappropriate, (c) criminal or (d) otherwise in breach of these
                Terms of Use. We do not and cannot review all materials posted
                to The Site by users, and we are not responsible for any such
                materials posted by users. However, we reserve the right at all
                times to disclose any information as necessary to satisfy any
                law, regulation or government request, or to edit, refuse to
                post or to remove any information or materials, in whole or in
                part, that in the sole discretion of The Company are
                objectionable or in violation of these Terms of Use.
              </li>
              <li>
                You hereby represent and warrant that you have all necessary
                rights in and to all Postings you provide and all material they
                contain and that such Postings shall not infringe any
                proprietary or other rights of third parties. By posting
                messages, uploading files, inputting data or engaging in any
                other form of communication (individually or collectively
                "Communications") to The Site, you hereby grant to The Company,
                subject to our privacy policy, a perpetual, worldwide,
                irrevocable, unrestricted, non-exclusive, royalty free license
                to use, copy, license, sublicense, adapt, distribute, display,
                publicly perform, reproduce, transmit, modify, edit and
                otherwise exploit such Communications, in all media now known or
                hereafter developed. You hereby waive all rights to any claim
                against The Company for any alleged or actual infringements of
                any proprietary rights, rights of privacy and publicity, moral
                rights, and rights of attribution in connection with such
                Communications.
              </li>
              <li>
                You acknowledge that transmissions to and from The Site are not
                confidential and your Communications may be read or intercepted
                by others. Any unprotected e-mail communication over the
                Internet is subject to possible interception or loss, is not
                confidential and is also subject to possible alteration. We are
                not responsible for and will not be liable to you or any third
                party for damages in connection with an e-mail sent by you to us
                or an e-mail sent by us to you, or anyone you designate, at your
                request. Violators of this section who use our services for any
                illegal purpose including but not limited to repeated unwanted
                emails or "Spam," may be prosecuted to the full extent of the
                law. You acknowledge that by submitting Communications to The
                Company, no confidential, fiduciary, contractually implied or
                other relationship is created between you and The Company other
                than pursuant to these Terms of Use and any subsequent written
                agreement entered into with The Company.
              </li>
              <li className="uppercase">
                The Site, including all content, software, functions, materials
                and information made available on or accessed through the site,
                is provided "as is, as available." To the fullest extent
                permissible by law. The Company and its subsidiaries and
                affiliates make no representation or warranties of any kind
                whatsoever for the content on the site or the materials,
                information and functions made accessible by the software used
                on or accessed through the site, for any products or services or
                hypertext links to third parties or for any breach of security
                associated with the transmission of sensitive information
                through the site or any linked site. Further, The Company and
                its subsidiaries and affiliates disclaim any express or implied
                warranties, including, without limitation, non-infringement,
                merchantability or fitness for a particular purpose. The Company
                does not warrant that the functions contained in the site or any
                materials or content contained therein will be uninterrupted or
                error free, that defects will be corrected, or that the site or
                the server that makes it available is free of viruses or other
                harmful components. The Company and its subsidiaries and
                affiliates shall not be liable for the use of the site,
                including, without limitation, the content and any errors
                contained therein. Further, in no event will The Company be
                liable for any loss of profits, business, use of data or for
                indirect, special, incidental or consequential damages of any
                kind whether based in contract, negligence or other tort. To the
                fullest extent permitted by applicable laws, we on behalf of our
                employees, agents, suppliers, and contractors, disclaim and
                exclude liability for any losses and expenses of whatever nature
                and howsoever arising, including without limitation any direct,
                indirect, special, punitive, or consequential damages, loss of
                use, loss of data, loss caused by a virus, loss of income or
                profit, loss of or damage to property, claims of third parties,
                or other losses of any kind or character, even if we have been
                advised of the possibility of such damages or losses, arising
                out of or in connection with the use of this the site or any web
                site with which it is linked. You assume total responsibility
                for establishing such procedures for data back up and virus
                checking as you consider necessary.
              </li>
              <li>
                You hereby agree to indemnify, defend and hold The Company, and
                all its officers, directors, owners, agents, employees,
                information providers, affiliates, licensors and licensees
                (collectively, the "Indemnified Parties") harmless from and
                against any and all liability and costs incurred by the
                Indemnified Parties in connection with any claim arising out of
                any breach by you of these Terms of Use or the foregoing
                representations, warranties and covenants, including, without
                limitation, attorneys' fees and costs. You shall cooperate as
                fully as reasonably required in the defense of any claim. The
                Company reserves the right, at its own expense, to assume the
                exclusive defense and control of any matter otherwise subject to
                indemnification by you and you shall not in any event settle any
                matter without the written consent of The Company.
              </li>
              <li>
                Where we provide hypertext links from or to third party sites we
                do so for convenience and information purposes only. We do not
                review, endorse, approve or control, and are not responsible for
                any sites linked from or to the Website, the content of those
                sites, the third parties named therein, or their products,
                resources or services. Linking to any other site is at your sole
                risk and we will not be responsible or liable for any damages in
                connection with linking, and we accept no liability nor make any
                endorsement or approval of the same.
              </li>
              <li>
                These Terms of Use contain the entire understanding between us
                with respect of The Site and no representation, statement,
                inducement oral or written, not contained herein shall bind
                either of us. The Company reserves the right, at its sole
                discretion, to change, modify, add or remove any portion of
                these Terms of Use, in whole or in part, at any time.
                Notification of changes in these Terms of Use will be posted on
                The Site.
              </li>
              <li>
                Should any part of the Terms of Use be declared invalid or
                unenforceable by a court of competent jurisdiction, this shall
                not affect the validity of any remaining portion and such
                remaining portion shall remain in full force and effect as if
                the invalid portion of the Terms of Use had been eliminated.
              </li>
              <li>
                The Site, any information provided from it and the Terms of Use
                are given and made in Australia.{" "}
                <span className="uppercase">
                  This terms of use agreement shall be governed by and construed
                  in accordance with the laws of Australia, without regard to
                  conflicts of laws provisions. Sole and exclusive jurisdiction
                  for any action or proceeding arising out of or related to this
                  terms of use agreement shall be an appropriate state or
                  federal court located in Australia.
                </span>
              </li>
              <li>
                Pursuant to Federal law we are providing the following separate
                written statement for your review and to acknowledge receipt
                thereof, which, pursuant to the requirements of Federal law,
                will also be delivered with any contract entered into with The
                Company.
              </li>
              <li>
                The terms and conditions of use in this Terms of Use are subject
                to change at any time. You should review the Terms of Use
                regularly for any changes.
              </li>
            </ol>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Purchases
            </h2>
            <p>
              When you make a purchase on the Website, you will be able to
              choose the third party payment processor that will collect your
              payment information and process your payment. We allow you to make
              purchases using the following third party payment processors:
              PayPal and Stripe. We are not responsible for the collection, use,
              sharing or security of your billing information by these third
              party payment processors. The following payment method(s) are
              accepted by the third party payment processors: American Express,
              MasterCard, and Visa.
            </p>
            <p>
              You hereby represent and warrant that you have the legal right to
              use the payment method(s) in connection with any purchase and that
              the information that you supply to us and to the third party
              payment processor(s) is true, correct and complete.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Cancellation policy
            </h2>
            <p>
              We do not offer you the ability to cancel any purchases that you
              have made of the services offered on our Website.
            </p>
            <p>
              We reserve the right to cancel your purchase for any reason, in
              our sole discretion, including but not limited to fraud,
              inaccuracies, and unavailability of the items or services
              purchased. We will not provide you with any notice prior to
              cancelling your purchase.
            </p>
            <p>
              We will not be able to issue you a refund of the purchase price
              that you paid if we cancel your purchase.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Refund policy
            </h2>
            <p>
              We offer refunds on purchases made of the services offered on our
              Website. To qualify for a refund, you must submit your request to
              us within 48 hours of your purchase date by contacting us and via
              the Website. We offer refunds on any purchases of the services
              offered on our Website for the following reason(s) only: the good,
              digital product or service failed to meet the warranties, if any
              and the wrong product or service was provided. Please note that we
              do not offer refunds for any other reasons other than those listed
              above.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              No warranty on purchases
            </h2>
            <p className="uppercase">
              The items or services displayed or sold on this website are
              provided “as is.” No warranty, express or implied (including any
              implied warranty of merchantability, of satisfactory quality or
              fitness for a particular purpose or use) shall apply to any items
              or services displayed or sold on this website, whether arising by
              law, course of dealing, course of performance, usage of trade or
              otherwise.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Remedies
            </h2>
            <p>
              You agree that the remedies for breach of this Terms of Service as
              it relates to your purchase shall be:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium text-slate-700">
              <li>Price reduction;</li>
              <li>Service extension.</li>
            </ul>
            <p>
              You also agree that the remedy for breach of this Terms of Service
              as it relates to your purchase shall be to pursue dispute
              resolution as provided in the “governing law, severability,
              dispute resolution, venue and class action waiver” section below.
              These remedies intended to be your sole and exclusive remedies for
              any breach of this Terms of Service as it relates to your
              purchase.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Automatic renewals of subscriptions
            </h2>
            <p className="uppercase">
              When you purchase a subscription on the website, your subscription
              will automatically renew every month. We will automatically renew
              your subscription by using the payment method on file until you
              cancel your subscription.
            </p>
            <p className="uppercase">
              You may cancel the automatic renewals of your subscription via the
              following means:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-bold text-slate-700 uppercase">
              <li>Email - contact@virallized.com</li>
            </ul>
            <p className="uppercase">
              Please note that you will no longer receive the items or services
              provided by the subscription on your cancellation effective date.
            </p>
            <p className="uppercase">
              You must provide us with 72 hours notice prior to your automatic
              renewal date of your intent to cancel the automatic renewals for
              the cancellation to be effective.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Accounts
            </h2>
            <p>
              When you create an account on our Website, you guarantee that you
              are 18 years of age or older and that the information that you
              provide us is accurate, complete, and current at all times.
              Inaccurate, incomplete, or obsolete information may result in the
              immediate termination of your account on the Website.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your
              account and password, including but not limited to the restriction
              of access to your computer and/or account. You agree to accept
              responsibility for any and all activities or actions that occur
              under your account and/or password, whether your password is with
              our Website or a third party service. You must notify us
              immediately upon becoming aware of any breach of security or
              unauthorized use of your account.
            </p>
            <p>
              We reserve the right to terminate your account anytime at our sole
              discretion. You can terminate your account by contacting us or
              through their account on the Website.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Comments and uploading content
            </h2>
            <p>
              By submitting a comment or uploading content onto this Website,
              you grant Virallized a worldwide, non-exclusive, perpetual,
              royalty-free license to reproduce, publish and distribute the
              comment or content. When you make a comment or upload any content
              onto this Website, you agree that such comment or content may be
              viewed by other parties and it is your responsibility to ensure
              that the comment or content does not contain any confidential or
              proprietary information. You are also responsible for ensuring
              that your content or comment does not violate any laws, rules or
              regulations. We reserve the right to remove any content or comment
              at any time in our sole discretion.
            </p>
            <p>
              The following is a non-exhaustive list of types of content or
              comments that you are prohibited from posting on our Website:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium text-slate-700">
              <li>Content that harrasses others;</li>
              <li>Content that is discriminatory or offensive;</li>
              <li>Swearing, name calling and otherwise abusive content;</li>
              <li>Pornographic and sexually explicit content;</li>
              <li>Content displaying, depicting or suggesting violence;</li>
              <li>Content that exploits or abuses children;</li>
              <li>Content encouraging or committing illegal acts;</li>
              <li>Content sharing personal information without consent;</li>
              <li>
                Content infringing on someone’s rights, including intellectual
                property rights;
              </li>
              <li>
                Content advertising products or services without our permission;
              </li>
              <li>Content whose purpose is spamming others.</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Prohibited uses
            </h2>
            <p>
              You agree that you will use this Website in accordance with all
              applicable laws, rules, regulations and these Terms at all times.
              The following is a non-exhaustive list of prohibited uses of this
              Website. You agree that you will not perform any of the following
              prohibited uses:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium text-slate-700">
              <li>
                Impersonating or attempting to impersonate Virallized or its
                employees, representatives, subsidiaries or divisions;
              </li>
              <li>
                Misrepresenting your identity or affiliation with any person or
                entity;
              </li>
              <li>
                Sending or attempting to send any advertising or promotional
                material, including but not limited to spam, junk mail, chain
                mail or any similar material;
              </li>
              <li>
                Engaging in any conduct that restricts or inhibits any person’s
                use or enjoyment of the Website, or which, as determined in our
                sole discretion, may harm us or the users of this Website or
                expose us or other users to liability;
              </li>
              <li>
                Using the Website in any manner that could disable, overburden,
                damage or impair the Website or interfere with another party’s
                use of the Website;
              </li>
              <li>
                Using any robot, spider or other similar automatic technology,
                process or means to access or use the Website for any purpose,
                including monitoring or copying any of the material on this
                Website;
              </li>
              <li>
                Using any manual process or means to monitor or copy any of the
                material on this Website or for any other unauthorized purpose;
              </li>
              <li>
                Using any device, software, means or routine that interferes
                with the proper working of the Website, including but not
                limited to viruses, trojan horses, worms, logic bombs or other
                such materials;
              </li>
              <li>
                Attempting to gain unauthorized access to, interfering with,
                damaging or disrupting any parts of the Website, the server(s)
                on which the Website is stored, or any server, computer or
                database connected to the Website;
              </li>
              <li>
                Attempting to attack or attacking the Website via a
                denial-of-service attack or a distributed denial-of-service
                attack;
              </li>
              <li>
                Otherwise attempting to interfere with the proper working of the
                Website;
              </li>
              <li>
                Using the Website in any way that violates any applicable
                federal, state or local laws, rules or regulations.
              </li>
            </ul>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              No warranty on website
            </h2>
            <p className="uppercase">
              This website are provided “as is.” No warranty, express or implied
              (including any implied warranty of merchantability, of
              satisfactory quality or fitness for a particular purpose or use)
              shall apply to this website, whether arising by law, course of
              dealing, course of performance, usage of trade or otherwise.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Availability, errors and inaccuracies
            </h2>
            <p>
              We assume no liability for the availability, errors or
              inaccuracies of the information, products or services provided on
              this Website. We may experience delays in updating information on
              this Website and in our advertising on other websites. The
              information, products and services found on the Website may
              contain errors or inaccuracies or may not be complete or current.
              Products or services may be incorrectly priced or unavailable. We
              expressly reserve the right to correct any pricing errors on our
              Website. The inclusion or offering of any product or service on
              this Website does not constitute an endorsement or recommendation
              of such product or service by us.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Damages and limitation of liability
            </h2>
            <p className="uppercase">
              In no event shall Virallized be liable for any direct, indirect,
              punitive, incidental, special or consequential damages arising out
              of, relating to or in any way connected with your access to,
              display of or use of this website or with the delay or inability
              to access, display or use this website, including but not limited
              to your reliance upon opinions or information appearing on this
              website; any computer viruses, information, software, linked
              websites operated by third parties, products or services obtained
              through this website, whether based on a theory of negligence,
              contract, tort, strict liability, consumer protection statutes or
              otherwise, even if Virallized has been advised of the possibility
              of such damages.
            </p>
            <p className="uppercase">
              This limitation of liability reflects the allocation of risk
              between you and us. The limitations specified in this section will
              survive and apply even if any limited remedy specified in these
              terms of use is found to have failed of its essential purpose. The
              limitations of liability provided in these terms of use inure to
              the benefit of Virallized.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Links to third party websites
            </h2>
            <p>
              This Website may contain hyperlinks to websites operated by third
              parties and not by us. We provide such hyperlinks for your
              reference only. We do not control such websites and are not
              responsible for their contents or the privacy or other practices
              of such websites. Further, it is your responsibility to take
              precautions to ensure that whatever links you click on or software
              that you download, whether from this Website or other websites or
              applications, is free of such items as viruses, worms, trojan
              horses, defects and other items of a destructive nature. Our
              inclusion of hyperlinks to such websites does not imply any
              endorsement of the material on such websites or any association
              with their operators.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Intellectual property and DMCA notice and procedure for
              intellectual property infringement claims
            </h2>
            <p>
              All contents of this Website are ©2021 Virallized or third
              parties. All rights reserved. Unless specified otherwise, this
              Website and all content and other materials on this Website
              including but not limited to all logos, designs, text, graphics,
              pictures, information, data, software, sound files and arrangement
              thereof (collectively, “Content”) are the proprietary property of
              Virallized and are either registered trademarks, trademarks or
              otherwise protected intellectual property of Virallized or third
              parties in the United States and/or other countries.
            </p>
            <p>
              If you are aware of a potential infringement of our intellectual
              property, please contact Jay at{" "}
              <a
                href="mailto:contact@virallized.com"
                className="text-[#f80d5d] font-bold hover:underline"
              >
                contact@virallized.com
              </a>
              .
            </p>
            <p>
              We respect the intellectual property rights of others. It is our
              policy to respond to any claim that Content posted on the Website
              infringes on the copyright, trademark or other intellectual
              property rights of any person or entity.
            </p>
            <p>
              If you believe in good faith that the Content infringes on your
              intellectual property rights, you or your agent may send us a
              written notice of such infringement titled “Infringement of
              Intellectual Property Rights - DMCA.” Your notice to us must
              include the following information:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium text-slate-700">
              <li>
                An electronic or physical signature of the person authorized to
                act on behalf of the owner of the intellectual property right’s
                interest;
              </li>
              <li>
                A description of the work that you claim has been infringed,
                including the URL (i.e., web page address) of the location where
                the work exists or a copy of the work;
              </li>
              <li>Your name, email, address and telephone number; and</li>
              <li>
                A statement by you that you have a good faith belief that the
                disputed use is not authorized by the owner of the work, its
                agent or the law.
              </li>
            </ul>
            <p>
              Please note that we will not process your complaint if it is not
              properly filled out or is incomplete. You may be held accountable
              for damages, including but not limited to costs and attorneys’
              fees for any misrepresentation or bad faith claims regarding the
              infringement of your intellectual property rights by the Content
              on this Website.
            </p>
            <p>
              You may submit your claim to us by contacting us at:
              <br />
              <br />
              <strong>Virallized</strong>
              <br />
              Jay
              <br />
              <a
                href="mailto:contact@virallized.com"
                className="text-[#f80d5d] font-bold hover:underline"
              >
                contact@virallized.com
              </a>
              <br />
              +61405299883
              <br />
              Blair Street, Broadmeadows, VIC 3047 Australia
              <br />
              UNITED STATES
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Governing law, severability, dispute resolution and venue
            </h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of the state of New York, United States, without regard to
              its conflict of laws provisions.{" "}
              <span className="uppercase">
                These terms shall not be governed by the United Nations
                Convention on Contracts for the International Sale of Goods, the
                Uniform Commercial Code, nor Incoterms.
              </span>
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of that right or provision. If any
              provision of these Terms is held to be invalid or unenforceable by
              a court, the remaining provisions of these Terms will remain in
              effect. These Terms constitute the entire agreement between you
              and us regarding our Website, and supersede and replace any prior
              agreements we might have had with you regarding the Website.
            </p>
            <p>
              Any controversy or claim arising out of or relating to these Terms
              including but not limited to the interpretation or breach thereof
              shall be resolved in a court of competent jurisdiction in New York
              County, New York.
            </p>
            <p className="uppercase font-bold">
              You and Virallized agree that each may bring claims against the
              other only in your or its individual capacity and not as a
              plaintiff or class member in any class or representative action.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Changes to Terms of Service
            </h2>
            <p>
              We reserve the right to make changes to these Terms of Service at
              any time. We will notify you immediately of making any changes to
              these Terms of Service via by posting the updated terms of service
              to this website and via an email campaign.
            </p>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-12 mb-4">
              Questions
            </h2>
            <p>
              If you have any questions about our Terms of Service, please
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
          Copyright © 2023 Virallized. All Rights Reserved
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
