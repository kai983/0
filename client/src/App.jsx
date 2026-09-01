import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import Incoming from './pages/Incoming.jsx'
import ArchiveList from './pages/ArchiveList.jsx'
import AddItem from './pages/AddItem.jsx'
import ItemDetail from './pages/ItemDetail.jsx'
import Review from './pages/Review.jsx'
import { consumeShare, onShare } from './sharing'

export default function App() {
  const [shared, setShared] = useState(null)

  useEffect(() => {
    // A share can have launched the app, or arrive while it is open.
    consumeShare().then((value) => value && setShared(value))
    return onShare((value) => setShared(value))
  }, [])

  if (shared) {
    return (
      <div className="app-shell">
        <div className="main-column">
          <Incoming shared={shared} onDone={() => setShared(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="main-column">
        <Routes>
          <Route path="/" element={<ArchiveList />} />
          <Route path="/review" element={<Review />} />
          <Route path="/add" element={<AddItem />} />
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
