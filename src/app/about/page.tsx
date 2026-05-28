import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-[#4f86f7]/20 via-[#0d1430] to-[#0d1430] border border-[#4f86f7]/20 rounded-2xl px-6 py-5 mb-8 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-[#4f86f7]/15 flex items-center justify-center text-2xl shrink-0">🧠</div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">About AI Innovation Hub</h1>
          <p className="text-white/50 text-sm mt-0.5">A shared internal space for AI ideas at ZoomRx</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-3">What is this?</h2>
          <p className="text-white/60 leading-relaxed">
            The AI Innovation Hub is a shared internal space for ZoomRx teams to surface, track, and learn from AI ideas — whether they worked or not. It's a living record of what we've tried, what we're exploring, and what's actually been put into practice.
          </p>
        </div>

        <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-3">Who is it for?</h2>
          <p className="text-white/60 leading-relaxed">
            Anyone at ZoomRx — no technical background needed to submit. If you have an idea for how AI could help your work, this is the place to share it. Domain knowledge matters just as much as technical knowledge when it comes to spotting the right opportunities.
          </p>
        </div>

        <div className="bg-[#0d1430] border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">How it works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#4f86f7]/15 flex items-center justify-center text-[#4f86f7] font-bold shrink-0">1</div>
              <div>
                <p className="font-semibold text-white">Submit an Idea</p>
                <p className="text-white/50 text-sm mt-0.5">Describe the AI concept, the expected outcome, and what stage it's at. Takes under two minutes.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#4f86f7]/15 flex items-center justify-center text-[#4f86f7] font-bold shrink-0">2</div>
              <div>
                <p className="font-semibold text-white">Community tries it &amp; reacts</p>
                <p className="text-white/50 text-sm mt-0.5">Colleagues can like ideas, leave comments, and report whether they tried implementing it — and what happened.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-[#4f86f7]/15 flex items-center justify-center text-[#4f86f7] font-bold shrink-0">3</div>
              <div>
                <p className="font-semibold text-white">Ideas that work get flagged as Implemented</p>
                <p className="text-white/50 text-sm mt-0.5">Authors update the stage as ideas progress. Implemented ideas stay visible so others can learn from or build on them.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#4f86f7]/10 via-[#0d1430] to-[#0d1430] border border-[#4f86f7]/20 rounded-2xl p-8 text-center">
          <p className="text-white/60 mb-4">Have an AI idea worth sharing?</p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 bg-[#4f86f7] hover:bg-[#3b72e0] text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-[#4f86f7]/30"
          >
            + Submit an Idea
          </Link>
        </div>
      </div>
    </div>
  )
}
