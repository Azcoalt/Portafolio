import { useEffect, useMemo, useState } from 'react'
import './App.css'
import logo from './assets/logo.png'
import { Card } from './components/Card'
import { GalaxyBackground } from './GalaxyBackground'
import { Model } from './3D/Model'
import { fetchPublicRepos, GITHUB_PROFILE_URL } from './services/githubRepos'

const INITIAL_VISIBLE_COUNT = 9

function App() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchPublicRepos({
      signal: controller.signal,
      forceRefresh: reloadNonce > 0,
    })
      .then((publicRepos) => {
        if (!active) return
        setRepos(publicRepos)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setError('No se pudieron cargar los repositorios desde GitHub en este momento.')
        setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [reloadNonce])

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setReloadNonce((n) => n + 1)
  }

  const liveCount = useMemo(
    () => repos.filter((repo) => Boolean(repo.websiteUrl)).length,
    [repos]
  )

  const filteredRepos = useMemo(() => {
    if (filter === 'live') {
      return repos.filter((repo) => Boolean(repo.websiteUrl))
    }
    return repos
  }, [repos, filter])

  const visibleRepos = useMemo(() => {
    if (filter === 'live' || showAll) {
      return filteredRepos
    }
    return filteredRepos.slice(0, INITIAL_VISIBLE_COUNT)
  }, [filteredRepos, filter, showAll])

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter)
    setShowAll(false)
  }


  return (
    <>
      <GalaxyBackground />

      {/**Herro section */}
      <section className='Hero-Section'>
        <div className='Hero'>

          <div className='First'>
            <img src={logo} alt="David Torres Logo" className="Hero-Logo" />
            <h4 className='Title'>David Torres</h4>
          </div>

          <div className='Second'>
            <div className='Isquierda-Second'>
              <p className='Title-second'>Full-Stack Developer</p>
              <p className='Description'>Enfocado en el desarrollo de aplicaciones web escalables.</p>
              {/*<button onClick={() => document.querySelector('.About-Section')?.scrollIntoView({ behavior: 'smooth' })}>Saber más</button>*/}
            </div>
            <div className='Derecha-Second'>
              <Model/>
            </div>
          </div>

        </div>
      </section>

      {/**Experience section */}
      <section className='About-Section'>
        <div className='About'>
          <h4 className='Experiencie'>Experiencia</h4>

          <div className='Table-Experience'>
            {/* Fila de OuiTrend */}
            <div className='Experience-Row'>
              <div className='Col-Info'>
                <p className="Title-Empresa">OUITREND</p>
                <p className="Description">Desarrollo de páginas web para los clientes de la empresa e implementación de nuevas funciones para las plataformas de OuiTrend.</p>
              </div>
              <div className='Col-Time'>
                <p className="exact-time">Marzo 2026 - Actualidad</p>
              </div>
            </div>

            {/* Fila de MetaGym */}
            <div className='Experience-Row'>
              <div className='Col-Info'>
                <p className="Title-Empresa">METAGYM</p>
                <p className="Description">Desarrollo del e-commerce MetaGym e implementación de un visor 3D interactivo para productos.</p>
              </div>
              <div className='Col-Time'>
                <p className="exact-time">Agosto 2025 - Diciembre 2025</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/**Proyects */}
      <section className="Proyects-Section">
        <h4 className='Title-Proyecs'>Proyectos</h4>

        {!loading && !error && repos.length > 0 && (
          <div className="Projects-Filter-Bar">
            <button
              type="button"
              className={`Filter-Btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              Todos ({repos.length})
            </button>
            {liveCount > 0 && (
              <button
                type="button"
                className={`Filter-Btn ${filter === 'live' ? 'active' : ''}`}
                onClick={() => handleFilterChange('live')}
              >
                Con sitio web ({liveCount})
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="Projects-State">
            <p>{error}</p>
            <div className="Projects-State-Actions">
              <button
                type="button"
                className="Projects-Action-Btn"
                onClick={handleRetry}
              >
                Reintentar
              </button>
              <a
                href={`${GITHUB_PROFILE_URL}?tab=repositories`}
                target="_blank"
                rel="noopener noreferrer"
                className="Projects-Action-Link"
              >
                Ver en GitHub
              </a>
            </div>
          </div>
        )}

        {!error && (
          <>
            <div className='Table-Proyects'>
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="github-card skeleton" aria-hidden="true">
                      <div className="card-top">
                        <div className="skeleton-line skeleton-title" />
                        <div className="skeleton-line skeleton-text" />
                        <div className="skeleton-line skeleton-text short" />
                      </div>
                      <div className="project-tech-stack">
                        <span className="skeleton-line skeleton-pill" />
                        <span className="skeleton-line skeleton-pill" />
                      </div>
                    </div>
                  ))
                : visibleRepos.map((repo) => (
                    <Card
                      key={repo.id}
                      name={repo.name}
                      description={repo.description}
                      repoUrl={repo.repoUrl}
                      websiteUrl={repo.websiteUrl}
                      techStack={repo.techStack}
                    />
                  ))}
            </div>

            {!loading && filter === 'all' && filteredRepos.length > INITIAL_VISIBLE_COUNT && (
              <div className="Projects-More-Wrap">
                <button
                  type="button"
                  className="Projects-More-Btn"
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll
                    ? 'Mostrar menos'
                    : `Ver todos los proyectos (${filteredRepos.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/** Contac */}
      <section className='Contact-Section'>
        <h4 className="Title-Contac">Contacto</h4>
        <form className="Contact-Form">
          <div className="Form-Group">
            <label htmlFor="name">Nombre</label>
            <input type="text" id="name" placeholder="Tu nombre" required />
          </div>

          <div className="Form-Group">
            <label htmlFor="email">Correo electrónico</label>
            <input type="email" id="email" placeholder="tucorreo@example.com" required />
          </div>

          <div className="Form-Group">
            <label htmlFor="message">Mensaje</label>
            <textarea id="message" rows="5" placeholder="Escribe tu mensaje aquí..." required></textarea>
          </div>

          <button type="submit" className="Submit-Btn">Enviar mensaje</button>

          {/* Fila de iconos para Redes Sociales */}
          <div className="Social-Icons-Row">
            {/* Enlace a LinkedIn */}
            <a href="https://www.linkedin.com/in/david-torres-pérez" target="_blank" rel="noopener noreferrer" className="Social-Icon" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>

            {/* Enlace a GitHub */}
            <a href={GITHUB_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="Social-Icon" title="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </a>
          </div>
        </form>
      </section>
    </>
  )
}

export default App
