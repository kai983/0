import { NavLink, Route, Routes } from 'react-router-dom'
import ArchiveList from './pages/ArchiveList.jsx'
import AddItem from './pages/AddItem.jsx'
import ItemDetail from './pages/ItemDetail.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">📚 나의 지식 아카이브</div>
        <nav>
          <NavLink to="/" end>
            아카이브
          </NavLink>
          <NavLink to="/add">+ 새 지식</NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<ArchiveList />} />
          <Route path="/add" element={<AddItem />} />
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </main>
    </div>
  )
}
