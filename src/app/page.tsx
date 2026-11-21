import { OrderForm } from "@/components/OrderForm";
import { Photo } from "@/components/Photo";
import { BAKERY, BAKES, HOURS } from "@/lib/bakery";
import { PHOTOS } from "@/lib/photos";

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <p className="demo-banner">Portfolio sample: an invented business, made by jdcreative.studiodesign</p>

      <header className="container site-header">
        <p className="logo">{BAKERY.name}</p>
        <nav aria-label="Main">
          <a href="#bakes">Today&apos;s bakes</a>
          <a href="#story">Our story</a>
          <a href="#order" className="button button-primary button-small">
            Order ahead
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="container hero" aria-labelledby="hero-title">
          <p className="eyebrow">Open Wednesday to Sunday, 7:00 to 15:00</p>
          <h1 id="hero-title">Baked this morning, gone by this afternoon.</h1>
          <p className="lead">
            Sourdough, pastries and cakes made by hand in small batches. Order ahead and we&apos;ll keep yours aside.
          </p>
          <div className="actions">
            <a href="#order" className="button button-primary">
              Order ahead
            </a>
            <a href="#bakes" className="button button-outline">
              See today&apos;s bakes
            </a>
          </div>
          <Photo photo={PHOTOS["bakery-hero"]} sizes="(max-width: 928px) 100vw, 880px" className="hero-photo" eager />
        </section>

        <section id="bakes" className="panel" aria-labelledby="bakes-title">
          <div className="container">
            <h2 id="bakes-title">Today&apos;s bakes</h2>
            <ul className="bake-grid">
              {BAKES.map((bake) => (
                <li key={bake.id} className="bake">
                  <Photo
                    photo={PHOTOS[bake.photo]}
                    sizes="(max-width: 560px) 100vw, (max-width: 1120px) 50vw, 260px"
                    className="bake-photo"
                  />
                  <h3>{bake.name}</h3>
                  <p className="muted">{bake.description}</p>
                  <p className="price">{bake.price}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="story" className="container story" aria-labelledby="story-title">
          <div className="story-text">
            <h2 id="story-title">Small batches, on purpose</h2>
            <p className="muted">
              We bake a little of everything, every morning, and stop when it&apos;s gone. That keeps it fresh and means
              nothing sits on a shelf overnight.
            </p>
            <p className="muted small">Customer reviews will appear here once the bakery is live.</p>
          </div>
          <Photo photo={PHOTOS["bakery-story"]} sizes="(max-width: 860px) 100vw, 520px" className="story-photo" />
        </section>

        <section id="order" className="order-section" aria-labelledby="order-title">
          <div className="container order">
            <h2 id="order-title">Order ahead</h2>
            <p className="muted">
              Tell us what you&apos;d like and when you&apos;ll pick it up, up to {BAKERY.orderWindowDays} days ahead.
              Pay when you collect.
            </p>
            <OrderForm />
          </div>
        </section>
      </main>

      <footer className="container site-footer">
        <div>
          <h2 className="footer-heading">Find us</h2>
          <p className="muted">[STREET ADDRESS]</p>
          <p className="muted">[CITY, POSTCODE]</p>
        </div>
        <div>
          <h2 className="footer-heading">Hours</h2>
          {HOURS.map((line) => (
            <p key={line} className="muted">
              {line}
            </p>
          ))}
        </div>
        <p className="muted small credit">Demo site by jdcreative.studiodesign</p>
      </footer>
    </>
  );
}
