import '../../styles/footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="vtufest-footer">
      <div className="vtufest-footer-inner">
        {/* Copyright */}
        <span className="vtufest-footer-copy">
          &copy; {year} VTU Habba &middot; Acharya Institutes. All rights reserved.
        </span>

        {/* Divider dot — hidden on very small screens */}
        <span className="vtufest-footer-dot" aria-hidden="true">&bull;</span>

        {/* Credits */}
        <span className="vtufest-footer-credits">
          Developed by&nbsp;
          <a
            href="https://www.sudeepbro.works/homepage"
            target="_blank"
            rel="noopener noreferrer"
            className="vtufest-footer-link"
          >
            ShettyBro
          </a>
          &nbsp;&amp;&nbsp;
          <a
            href="https://www.linkedin.com/in/rohith-reddy-b-5b3639317/"
            target="_blank"
            rel="noopener noreferrer"
            className="vtufest-footer-link"
          >
            Rohit Reddy
          </a>
        </span>
      </div>
    </footer>
  );
}
