
import './App.css'
import { Icon } from './assets/Icon'
import { GalaxyBackground } from './GalaxyBackground'

function App() {
  

  return (
    <>
      <GalaxyBackground />
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
      <section className='About-Section'>
        <div className='About'></div>
      </section>
    </>
  )
}

export default App
