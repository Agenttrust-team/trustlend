"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ArrowUpRight,
  ArrowRight,
  Wallet,
  Globe2,
  ShieldCheck,
  Sprout,
  MoveUpRight,
  Check,
  Plus,
} from "lucide-react";
import { BrandMark } from "./BrandMark";

export function WelcomeDashboard({ onConnect }: { onConnect: () => void }) {
  const locale = useLocale();
  return (
    <div className="trust-home">
      <header className="trust-page-heading">
        <div>
          <p className="trust-eyebrow">YOUR NEXT CHAPTER</p>
          <h1>Good things start with trust.</h1>
          <p>A home for your money. A way forward for you.</p>
        </div>
        <span className="trust-network">
          <span /> Built on Stellar
        </span>
      </header>

      <section className="trust-hero" aria-labelledby="welcome-title">
        <div className="trust-hero-copy">
          <span className="trust-pill">
            <span /> MONEY WITHOUT BORDERS
          </span>
          <h2 id="welcome-title">
            Small steps.
            <br />
            Bigger <em>possibilities.</em>
          </h2>
          <p>
            Support home. Build your credit. Fund someone’s next chapter. Put your financial story
            to work with TrustLend.
          </p>
          <button onClick={onConnect} className="trust-primary">
            Connect your wallet <ArrowUpRight size={18} />
          </button>
          <div className="trust-hero-note">
            <ShieldCheck size={15} /> Your wallet. Your keys. Your next move.
          </div>
        </div>
        <div className="trust-orbit" aria-hidden="true">
          <div className="trust-orbit-ring ring-one" />
          <div className="trust-orbit-ring ring-two" />
          <div className="trust-orbit-center">
            <BrandMark className="h-24 w-24" />
          </div>
          <div className="trust-orbit-label orbit-top">
            <Globe2 size={19} />
            <span>
              Closer to home<small>Send across borders</small>
            </span>
            <ArrowUpRight size={16} />
          </div>
          <div className="trust-orbit-label orbit-bottom">
            <Sprout size={20} />
            <span>
              Room to grow<small>Build your financial story</small>
            </span>
          </div>
          <div className="trust-orbit-spark">
            <Plus size={23} />
          </div>
          <span className="trust-orbit-caption">CONNECTED BY POSSIBILITY</span>
        </div>
      </section>

      <section aria-labelledby="move-heading" className="trust-moves">
        <div className="trust-section-heading">
          <h2 id="move-heading">Make your next move</h2>
          <span>One wallet. More possibilities.</span>
        </div>
        <div className="trust-action-grid">
          {[
            {
              icon: Wallet,
              title: "A little breathing room",
              label: "BORROW",
              text: "Explore loans that see the story behind your remittances.",
              href: "loans",
              color: "sage",
              cta: "Explore borrowing",
            },
            {
              icon: Sprout,
              title: "Help ambition grow",
              label: "LEND",
              text: "Put your funds to work and back someone’s next step.",
              href: "lend",
              color: "butter",
              cta: "Start lending",
            },
            {
              icon: Globe2,
              title: "Make distance smaller",
              label: "SEND",
              text: "Move money across borders, straight from your wallet.",
              href: "send-remittance",
              color: "peach",
              cta: "Send money",
            },
          ].map(({ icon: Icon, ...item }) => (
            <Link href={`/${locale}/${item.href}`} key={item.label} className="trust-action-card">
              <div className="trust-action-top">
                <span className={`trust-icon ${item.color}`}>
                  <Icon size={23} strokeWidth={1.6} />
                </span>
                <span className="trust-eyebrow">{item.label}</span>
                <ArrowUpRight size={18} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="trust-action-link">
                {item.cta}
                <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="trust-bottom-grid">
        <section className="trust-start" aria-labelledby="start-heading">
          <div className="trust-section-heading">
            <h2 id="start-heading">A fresh start, in three steps</h2>
            <span className="trust-mini-badge">LET’S BEGIN</span>
          </div>
          <ol className="trust-steps">
            <li>
              <span className="trust-step-number">01</span>
              <div>
                <h3>Bring your wallet</h3>
                <p>Connect your Stellar wallet to get started.</p>
              </div>
              <button onClick={onConnect} aria-label="Connect your Stellar wallet">
                <ArrowUpRight size={18} />
              </button>
            </li>
            <li>
              <span className="trust-step-number">02</span>
              <div>
                <h3>Choose your path</h3>
                <p>Borrow, provide liquidity, or send money home.</p>
              </div>
            </li>
            <li>
              <span className="trust-step-number">03</span>
              <div>
                <h3>Build on every move</h3>
                <p>Keep track of your activity and credit journey.</p>
              </div>
            </li>
          </ol>
        </section>
        <section className="trust-promise" aria-labelledby="promise-heading">
          <div className="trust-promise-icon">
            <ShieldCheck size={24} strokeWidth={1.5} />
          </div>
          <p className="trust-eyebrow">BUILT AROUND YOU</p>
          <h2 id="promise-heading">Your story has value.</h2>
          <p>
            Sending money home is more than a transfer. It’s a record of showing up. Let that
            history open new doors.
          </p>
          <div>
            <span>
              <Check size={14} /> Self-custody
            </span>
            <span>
              <Check size={14} /> On-chain history
            </span>
          </div>
          <Link href={`/${locale}/wallet`}>
            Meet your wallet <MoveUpRight size={16} />
          </Link>
        </section>
      </div>
      <footer className="trust-footer">
        <span>
          TrustLend <span className="trust-footer-dot">·</span> A little trust goes a long way.
        </span>
        <a href="https://github.com/Agenttrust-team/trustlend" target="_blank" rel="noreferrer">
          Built in the open <ArrowUpRight size={13} />
        </a>
      </footer>
    </div>
  );
}
