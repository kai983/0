import { Route, Routes } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import BottomNav from './components/BottomNav.jsx'
import ArchiveList from './pages/ArchiveList.jsx'
import AddItem from './pages/AddItem.jsx'
import ItemDetail from './pages/ItemDetail.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <Routes>
          <Route path="/" element={<ArchiveList />} />
          <Route path="/add" element={<AddItem />} />
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}
