import './HomePage.css'

interface HomePageProps {
  onNewContest: () => void
}

function HomePage({
  onNewContest,
}: HomePageProps) {
  return (
    <main className="home-page">
      <div className="home-content">
        <img
          className="home-logo"
          src="/images/logo.webp"
          alt="Bouleo"
        />

        <h1>Bouleo</h1>

        <p className="home-description">
          Organisez facilement vos concours
          de pétanque.
        </p>

        <div className="home-actions">
          <button
            className="home-primary-button"
            onClick={onNewContest}
          >
            Nouveau concours
          </button>

          <button
            className="home-secondary-button"
            type="button"
          >
            Ouvrir un concours
          </button>
        </div>
      </div>
    </main>
  )
}

export default HomePage