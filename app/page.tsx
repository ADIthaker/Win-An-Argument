import InputForm from "./components/input-form"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-primary py-6 px-4 md:px-6">
        <div className="container mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">DebateMate AI</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-8 flex-1">
        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-2">Summary</h2>
          <p className="text-muted-foreground">
          Your ultimate argument assistant! Powered by the latest research from PubMed and ArXiv, our AI agent helps you debunk medical and CS myths with solid scientific evidence. 
          Stay ahead in debates with real-time facts and citations. Win arguments, stay informed!
          </p>
        </section>

        <InputForm />
      </div>

      <footer className="bg-muted py-4 px-4 md:px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} DebateMate AI
        </div>
      </footer>
    </main>
  )
}

