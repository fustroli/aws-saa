import { useState } from 'react'
import { QUESTIONS } from './data/questions'
import { useProgress } from './useProgress'
import { Home } from './components/Home'
import { Setup, type Mode } from './components/Setup'
import { Session, type SessionResult } from './components/Session'
import { Summary } from './components/Summary'
import { SyncPanel } from './components/SyncPanel'
import type { Question } from './types'

type View =
  | { name: 'home' }
  | { name: 'setup'; mode: Mode }
  | { name: 'session'; mode: Mode; questions: Question[] }
  | { name: 'summary'; mode: Mode; results: SessionResult[] }

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })
  const { progress, recordAttempt, toggleBookmark, reset, sync, createSyncId, linkSyncId, disconnect, syncNow } =
    useProgress()
  const goHome = () => setView({ name: 'home' })

  return (
    <main className="container">
      <header className="app-header">
        <button className="brand" onClick={goHome}>
          <span className="brand-badge">SAA</span>
          <span>
            AWS Solutions Architect
            <small>Associate (SAA-C03) practice</small>
          </span>
        </button>
      </header>

      {view.name === 'home' && (
        <Home
          questions={QUESTIONS}
          progress={progress}
          synced={sync.id !== null}
          syncPanel={
            <SyncPanel
              sync={sync}
              onCreate={createSyncId}
              onLink={linkSyncId}
              onDisconnect={disconnect}
              onSyncNow={syncNow}
            />
          }
          onStart={(mode) => setView({ name: 'setup', mode })}
          onReset={reset}
        />
      )}

      {view.name === 'setup' && (
        <Setup
          mode={view.mode}
          questions={QUESTIONS}
          progress={progress}
          onStart={(questions) => setView({ name: 'session', mode: view.mode, questions })}
          onCancel={goHome}
        />
      )}

      {view.name === 'session' && (
        <Session
          questions={view.questions}
          bookmarks={progress.bookmarks}
          onAnswer={recordAttempt}
          onToggleBookmark={toggleBookmark}
          onFinish={(results) => setView({ name: 'summary', mode: view.mode, results })}
          onQuit={goHome}
        />
      )}

      {view.name === 'summary' && (
        <Summary
          results={view.results}
          onAgain={() => setView({ name: 'setup', mode: view.mode })}
          onHome={goHome}
        />
      )}
    </main>
  )
}
