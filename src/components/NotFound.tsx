export function NotFound() {
  return (
    <div className="pt-36 pb-28 text-center px-8">
      <div className="eyebrow mb-4">404</div>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">This page is not on the map.</h1>
      <p className="mt-4 text-[14px] text-[#A9B6D3] max-w-md mx-auto">The route you asked for does not exist. Everything that does exist is listed below.</p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <a href="/" className="cta-primary">Home</a>
        <a href="/connectors" className="cta-secondary">Connector catalogue</a>
        <a href="/developers/status" className="cta-secondary">Build status</a>
      </div>
    </div>
  )
}
