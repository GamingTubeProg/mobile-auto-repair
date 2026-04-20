import React from 'react';
import './Home.css';
import {
  Laptop, Settings, ShieldAlert, BatteryCharging,
  Car, Droplet, ThermometerSnowflake, Wrench,
  Fuel, Activity, Truck, Zap, Cpu
} from 'lucide-react';

const services = [
  {
    id: 1,
    title: 'Mobile Diagnostics',
    desc: 'Quick and accurate diagnostics for any vehicle issue.',
    symptoms: 'Dashboard warning lights, unknown noises, or sudden performance drops.',
    icon: <Laptop />,
    img: '/assets/diagnostics_service_1775239848189.png',
  },
  {
    id: 2,
    title: 'Engine Problems',
    desc: 'Diagnosing and addressing common engine problems.',
    symptoms: 'Engine not starting, engine running rough, poor idle quality, or heavy smoke.',
    icon: <Settings />,
    img: '/assets/engine_service_1775239884155.png',
  },
  {
    id: 3,
    title: 'Brake Issues',
    desc: 'Providing brake repairs to ensure safety and restore stopping power.',
    symptoms: 'Squealing or grinding noises, vibrating steering wheel while braking, long stopping distances.',
    icon: <ShieldAlert />,
    img: '/assets/brakes_service_1775239862608.png',
  },
  {
    id: 4,
    title: 'Battery Replacement',
    desc: 'Testing and replacement of vehicle batteries on the spot.',
    symptoms: 'Car won\'t start, slow engine turn-over, or flickering electronics.',
    icon: <BatteryCharging />,
    img: '/assets/battery_original.png',
  },
  {
    id: 5,
    title: 'Flat Tire Repair',
    desc: 'Fixing or replacing your tire and ensuring proper inflation.',
    symptoms: 'Visible flat tire, low tire pressure warning, or tire tread damage.',
    icon: <Car />,
    img: '/assets/tires_service_1775239901729.png',
  },
  {
    id: 6,
    title: 'Oil Change',
    desc: 'Keep your engine running smoothly with a convenient on-site oil change.',
    symptoms: 'Overdue maintenance schedule, low oil level light, or dark/gritty oil on the dipstick.',
    icon: <Droplet />,
    img: '/assets/oil_change_service_1775239915994.png',
  },
  {
    id: 7,
    title: 'Cooling System Repairs',
    desc: 'Prevent overheating with cooling system or radiator fixes.',
    symptoms: 'Overheating engine, coolant leaks on the ground, or steam coming from under the hood.',
    icon: <ThermometerSnowflake />,
    img: '/assets/radiator_original.jpg',
  },
  {
    id: 8,
    title: 'Suspension & Steering',
    desc: 'Diagnose and repair suspension or steering problems to keep you in control.',
    symptoms: 'Vehicle feeling unstable, strange clunking noises over bumps, or pulling to one side.',
    icon: <Wrench />,
    img: '/assets/brakes_no_person_1775255952995.png',
  },
  {
    id: 9,
    title: 'Fuel System Repairs',
    desc: 'Address issues with fuel pumps, injectors, and more.',
    symptoms: 'Stalling, loss of power, poor fuel economy, or failing to start despite turning over.',
    icon: <Fuel />,
    img: '/assets/engine_original.png',
  },
  {
    id: 10,
    title: 'Transmission Diagnostics',
    desc: 'Thorough diagnostics to determine shifting issues and guide repairs.',
    symptoms: 'Rough shifting, slipping gears, or hesitation during acceleration.',
    icon: <Activity />,
    img: 'https://images.pexels.com/photos/190537/pexels-photo-190537.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 11,
    title: 'Towing / Workshop Support',
    desc: 'If on-site repair is not possible, we offer towing support with a trusted partner workshop.',
    symptoms: 'Ensures your vehicle is safely transported for complex repairs requiring specialized conditions.',
    icon: <Truck />,
    img: '/assets/hero_mechanic_1775239834825.png',
  },
  {
    id: 12,
    title: 'No Start / No Crank Repairs',
    desc: 'Diagnosing and repairing vehicles that fail to start or crank.',
    symptoms: 'Turning the key does nothing, dashboard lights dim, clicking sound, or complete silence.',
    icon: <Zap />,
    img: '/assets/diag_laptop_no_person_1775256815028.png',
  },
  {
    id: 13,
    title: 'Starter & Alternator Repairs',
    desc: 'Repair and replacement of failing starter motors and alternators.',
    symptoms: 'Grinding noise when starting, slow cranking, battery warning light on, or frequent jump-starts.',
    icon: <Cpu />,
    img: '/assets/diagnostics_no_person_1775255939503.png',
  },
];

const handleSubmit = (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const service = fd.get('service') || 'Service Request';
  const details = fd.get('details') || '';
  const subject = encodeURIComponent(`Auto Repair Quote – ${service}`);
  const body = encodeURIComponent(details);
  window.location.href = `mailto:Mobile.Automotive@hotmail.com?subject=${subject}&body=${body}`;
};

const Home = () => {
  return (
    <div className="home-matte">
      {/* HERO SECTION */}
      <section className="hero-industrial" id="home">
        <div className="hero-img"></div>
        <div className="hero-content container">
          <div className="hero-card solid-box">
            <span className="subtitle">London, ON</span>
            <h1 className="title hero-title">PRECISION<br/>MOBILE<br/>SERVICE.</h1>
            <p>
              World-class automotive diagnostics, repair, and engineering directly to your location.
              Uncompromising technical expertise delivered without the showroom wait.
            </p>
            <div className="hero-actions">
              <a href="#contact" className="btn btn-primary">Book Consult</a>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE CATALOGUE */}
      <section className="showroom section" id="services">
        <div className="container">
          <header className="showroom-header">
            <span className="subtitle">Capabilities</span>
            <h2 className="title">Service Catalogue</h2>
          </header>

          <div className="showroom-grid">
            {services.map(svc => (
              <div className="service-tile" key={svc.id}>
                <div className="tile-img" style={{ backgroundImage: `url(${svc.img})` }}></div>
                <div className="tile-overlay"></div>
                <div className="tile-content">
                  <div className="tile-header">
                    <span className="tile-icon">{svc.icon}</span>
                    <h3>{svc.title}</h3>
                  </div>
                  <p className="tile-desc">{svc.desc}</p>
                </div>

                {svc.symptoms && (
                  <div className="tile-visor solid-box">
                    <h4>Symptoms &amp; Triggers</h4>
                    <p>{svc.symptoms}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about-split" id="about">
        <div className="about-image"></div>
        <div className="about-text-block">
          <span className="subtitle">The Craftsman</span>
          <h2 className="title">German Technical Excellence.</h2>
          <hr className="divider" />
          <p>
            I am a highly experienced automotive mechanic with a strong background in diagnosing
            and repairing complex vehicle issues. Having honed my craft in Germany, I specialize
            in the rigorous demands of European brands such as BMW, Mercedes-Benz, Audi, and Volkswagen.
          </p>
          <p>
            My specialization lies in advanced diagnostics, especially in identifying and resolving
            difficult and complex electronic problems. With modern vehicles becoming increasingly
            reliant on sophisticated systems, I use state-of-the-art diagnostic tools along with
            deep technical expertise to pinpoint issues efficiently and accurately. No guesswork. Just precision.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-split" id="contact">
        <div className="contact-info-block solid-box">
          <span className="subtitle">Logistics</span>
          <h2 className="title">Schedule Deployment.</h2>
          <p className="contact-lede">
            Skip the waiting room. Experience premium, on-site mechanical care tailored
            to your exact location and schedule.
          </p>

          <div className="contact-metrics">
            <div className="metric">
              <label>Phone</label>
              <a href="tel:519-617-7214">519-617-7214</a>
            </div>
            <div className="metric">
              <label>Email</label>
              <a href="mailto:Mobile.Automotive@hotmail.com">Mobile.Automotive@hotmail.com</a>
            </div>
            <div className="metric">
              <label>Base</label>
              <p>London, Ontario &amp; Surrounding</p>
            </div>
          </div>
        </div>

        <div className="contact-form-block">
          <form className="brutalist-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="f-name">Full Name</label>
              <input id="f-name" name="name" type="text" placeholder="John Doe" required />
            </div>
            <div className="form-group">
              <label htmlFor="f-vehicle">Vehicle Specs</label>
              <input id="f-vehicle" name="vehicle" type="text" placeholder="Year / Make / Model" required />
            </div>
            <div className="form-group">
              <label htmlFor="f-service">Requested Service</label>
              <select id="f-service" name="service" required defaultValue="">
                <option value="" disabled hidden>Select Issue...</option>
                {services.map(s => (
                  <option key={s.id} value={s.title}>{s.title}</option>
                ))}
                <option value="Other">Other / Unsure</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="f-details">Quote Details</label>
              <textarea
                id="f-details"
                name="details"
                rows="6"
                defaultValue={`Hi! I would like to request a quick quote for mobile auto repair services. Here are my details:\n\n- Vehicle Year/Make/Model: \n- Service Requested: \n- Observed Symptoms: \n- Location for On-site Service: \n- Preferred Date/Time: \n\nThank you!`}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary submit-btn">Submit Request</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
