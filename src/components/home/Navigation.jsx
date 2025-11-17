

// // "use client";

// // import React, { useState, useEffect } from "react";
// // import Link from "next/link";
// // import Image from "next/image";
// // import { Menu, X } from "lucide-react";

// // const Navigation = () => {
// //   const [scrolled, setScrolled] = useState(false);
// //   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
// //   const [activeSection, setActiveSection] = useState("home");
// //   const [isClient, setIsClient] = useState(false);

// //   useEffect(() => {
// //     setIsClient(true); // Ensure client-side rendering
// //   }, []);

// //   useEffect(() => {
// //     const handleScroll = () => {
// //       setScrolled(window.scrollY > 20);

// //       const sections = ["product", "how-it-works", "showcase", "pricing"];
// //       sections.forEach((id) => {
// //         const section = document.getElementById(id);
// //         if (section) {
// //           const top = section.offsetTop - 80;
// //           const bottom = top + section.offsetHeight;
// //           if (window.scrollY >= top && window.scrollY < bottom) {
// //             setActiveSection(id);
// //           }
// //         }
// //       });
// //     };

// //     window.addEventListener("scroll", handleScroll);
// //     return () => window.removeEventListener("scroll", handleScroll);
// //   }, []);

// //   const navLinks = [
// //     { name: "Product", href: "#product" },
// //     { name: "How it Works", href: "#how-it-works" },
// //     { name: "Showcase", href: "#showcase" },
// //     { name: "Pricing", href: "#pricing" },
// //   ];

// //   const handleLinkClick = (href) => {
// //     setMobileMenuOpen(false);
// //     const id = href.replace("#", "");
// //     const section = document.getElementById(id);
// //     if (section) section.scrollIntoView({ behavior: "smooth" });
// //   };

// //   if (!isClient) return null; // Avoid SSR mismatch

// //   return (
// //     <nav
// //       className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
// //         scrolled
// //           ? "bg-background/80 backdrop-blur-xl shadow-sm border-b border-border/50"
// //           : "bg-background/70 backdrop-blur-xl shadow-sm border-b border-border/50"
// //       }`}
// //     >
// //       <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
// //         <div className="flex items-center justify-between h-14 lg:h-18">
// //           <Link href="/" className="flex items-center gap-2">
// //             <Image
// //               src="/images/logo-splash.png"
// //               alt="Splash AI Studio"
// //               width={160}
// //               height={40}
// //               className="object-contain hover:scale-105 transition-transform duration-300 translate-y-2 mb-px"
// //             />
// //           </Link>

// //           <div className="hidden md:flex items-center gap-8">
// //             {navLinks.map((link) => (
// //               <button
// //                 key={link.name}
// //                 className={`text-sm lg:text-base font-medium transition-colors glassy-text ${
// //                   activeSection === link.href.replace("#", "")
// //                     ? "text-white"
// //                     : "text-white/80 hover:text-white"
// //                 }`}
// //                 onClick={() => handleLinkClick(link.href)}
// //               >
// //                 {link.name}
// //               </button>
// //             ))}
// //           </div>

// //           <div className="hidden md:block">
// //             <Link
// //               href="/auth"
// //               className="inline-block px-4 py-2 bg-accent text-accent-foreground font-medium rounded hover:bg-accent/90 transition-colors glassy-text"
// //             >
// //               Get Started
// //             </Link>
// //           </div>

// //           <button
// //             className="md:hidden p-2"
// //             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
// //             aria-label="Toggle menu"
// //           >
// //             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
// //           </button>
// //         </div>
// //       </div>

// //       {mobileMenuOpen && (
// //         <div className="md:hidden bg-background/70 border-t border-border">
// //           <div className="px-6 py-4 space-y-4">
// //             {navLinks.map((link) => (
// //               <button
// //                 key={link.name}
// //                 className="block w-full text-left text-base text-white/80 hover:text-white transition-colors font-medium glassy-text"
// //                 onClick={() => handleLinkClick(link.href)}
// //               >
// //                 {link.name}
// //               </button>
// //             ))}
// //             <Link
// //               href="/auth"
// //               className="block w-full text-center px-4 py-2 bg-accent text-accent-foreground font-medium rounded hover:bg-accent/90 transition-colors glassy-text"
// //               onClick={() => setMobileMenuOpen(false)}
// //             >
// //               Get Started
// //             </Link>
// //           </div>
// //         </div>
// //       )}

// //       <style jsx>{`
// //         .glassy-text {
// //           background: linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.8));
// //           -webkit-background-clip: text;
// //           -webkit-text-fill-color: transparent;
// //           background-clip: text;
// //           text-fill-color: transparent;
// //           text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
// //         }
// //       `}</style>
// //     </nav>
// //   );
// // };

// // export default Navigation;
// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { Menu, X } from "lucide-react";

// const Navigation = () => {
//   const [scrolled, setScrolled] = useState(false);
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => {
//       setScrolled(window.scrollY > 20);
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   const navLinks = [
//     { name: "Product", href: "#product" },
//     { name: "How it Works", href: "#how-it-works" },
//     { name: "Showcase", href: "#showcase" },
//     { name: "Pricing", href: "#pricing" },
//   ];

//   return (
//     <nav
//       className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//         scrolled
//           ? "bg-background/80 backdrop-blur-xl shadow-sm border-b border-border/50"
//           : "bg-background/70 backdrop-blur-xl shadow-sm border-b border-border/50"
//       }`}
//     >
//       <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
//         <div className="flex items-center justify-between h-14 lg:h-18">
//           {/* Logo */}
//           <Link href="/" className="flex items-center justify-center gap-2 group">
//             <img
//               src="/images/logo-splash.png"
//               alt="Splash AI Studio"
//               className="h-32 lg:h-40 w-auto object-contain hover:scale-105 transition-transform duration-300 translate-y-2 mb-px"
//             />
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex items-center gap-8">
//             {navLinks.map((link) => (
//               <a
//                 key={link.name}
//                 href={link.href}
//                 className="text-sm lg:text-base text-foreground/90 hover:text-[#A64DFF] transition-colors font-medium"
//               >
//                 {link.name}
//               </a>
//             ))}
//           </div>

//           {/* CTA Button */}
//           <div className="hidden md:block">
//             <Link
//               href="/auth"
//               className="inline-block px-4 py-2 text-sm lg:text-base font-medium text-accent-foreground bg-accent rounded hover:bg-accent/90 transition-colors"
//             >
//               Get Started
//             </Link>
//           </div>

//           {/* Mobile Menu Button */}
//           <button
//             className="md:hidden p-2"
//             onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//             aria-label="Toggle menu"
//           >
//             {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </div>

//       {/* Mobile Menu */}
//       {mobileMenuOpen && (
//         <div className="md:hidden bg-background border-t border-border">
//           <div className="px-6 py-4 space-y-4">
//             {navLinks.map((link) => (
//               <a
//                 key={link.name}
//                 href={link.href}
//                 className="block text-base text-foreground/90 hover:text-[#A64DFF] transition-colors font-medium"
//                 onClick={() => setMobileMenuOpen(false)}
//               >
//                 {link.name}
//               </a>
//             ))}
//             <Link
//               to="/auth"
//               className="block w-full px-4 py-2 text-base font-medium text-accent-foreground bg-accent rounded hover:bg-accent/90 transition-colors"
//               onClick={() => setMobileMenuOpen(false)}
//             >
//               Get Started
//             </Link>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navigation;
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Product", href: "#product" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Showcase", href: "#showcase" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200"
        : "bg-white/70 backdrop-blur-xl shadow-sm border-b border-gray-200"
        }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 group">
            <img
              src="/images/logo-splash.png"
              alt="Splash AI Studio"
              className="h-32 lg:h-40 w-auto object-contain hover:scale-105 transition-transform duration-300 translate-y-2 mb-px"
            />
          </Link>

          {/* Desktop Navigation */}
          {!isAuthPage && (
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm lg:text-base text-gray-800 hover:text-[#A64DFF] transition-colors font-medium"
                >
                  {link.name}
                </a>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href={isAuthPage ? "/" : "/login"}
              className="inline-block px-4 py-2 text-sm lg:text-base font-medium text-white bg-[#A64DFF] rounded hover:bg-purple-600 transition-colors"
            >
              {isAuthPage ? "Back to Home" : "Get Started"}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-6 py-4 space-y-4">
            {!isAuthPage && navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block text-base text-gray-800 hover:text-[#A64DFF] transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Link
              href={isAuthPage ? "/" : "/login"}
              className="block w-full px-4 py-2 text-base font-medium text-white bg-[#A64DFF] rounded hover:bg-purple-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {isAuthPage ? "Back to Home" : "Get Started"}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
