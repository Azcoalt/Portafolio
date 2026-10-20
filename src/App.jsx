
import './App.css'
import { Icon } from './assets/Icon'
import { GalaxyBackground } from './GalaxyBackground'

function App() {
  

  return (
    <>
      <GalaxyBackground />

      {/**Herro section */}
      <section className='Hero-Section'>
        <div className='Hero'>

          <div className='First'>
            <Icon/>
            <h4 className='Title'>David Torres</h4>
          </div>

          <div className='Second'>
            <div className='Isquierda-Second'>
              <p className='Title-second'>Frontend & Full-Stack Devloper</p>
              <p className='Description'>Enfocado en el desarrollo de aplicaciones web escalables.</p>
              <button>Saber más</button>
            </div>
            <div className='Derecha-Second'>
              <p>modelo 3D</p>
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
      </section>
    </>
  )
}

export default App
