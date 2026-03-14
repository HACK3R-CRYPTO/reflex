// TODO: /arena/[matchId] — Live match view, Reactivity-powered
export default function MatchPage({ params }: { params: { matchId: string } }) {
  return <main><h1>Match {params.matchId}</h1></main>;
}
