import "../components/Card.css"

export const Card = () => {
    return (
        <div className="github-card">
            <div className="card-header">
                {/* Icono de carpeta o de GitHub */}
                <svg className="folder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                {/* Enlace al repositorio */}
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="github-link">
                    <svg className="external-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>

            <h3 className="project-title">Nombre del Proyecto</h3>
            <p className="project-description">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.
            </p>

            <div className="project-tech-stack">
                <span>React</span>
                <span>Next.js</span>
                <span>Tailwind</span>
            </div>
        </div>
    )
}
