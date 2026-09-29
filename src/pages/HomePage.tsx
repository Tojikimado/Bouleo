interface HomePageProps {
  onNewContest: () => void
}

function HomePage({ onNewContest }: HomePageProps) {
  return (
    <main>
      <h1>Bouleo</h1>

      <p>
        Organisez facilement vos concours de pétanque.
      </p>

      <button onClick={onNewContest}>
        Nouveau concours
      </button>

      <button>
        Ouvrir un concours
      </button>
    </main>
  )
}

export default HomePage