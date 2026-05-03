import { useState,useEffect } from "react";
import{useNavigate} from "react-router-dom";
import{boardAPI} from "../Services/api";
import Navbar from"../components/layout/Navbar"
import toast from "react-hot-toast"

export default function Dashboard(){
    const[boards,setBoards]=useState([]);
    const[loading,setLoading]=useState(true);
    const[showModal,setShowModal]=useState(false);
    const[creating,setCreating]=useState(false);
    const[form,setForm]=useState({
        title:'',
        description:'',
        background:"#0052cc"
    })
    const navigate=useNavigate()
    const colors = ['#0052cc', '#00875a', '#ff5630', '#6554c0', '#ff8b00', '#00b8d9']

    useEffect(()=>{
       boardAPI.getAll()
        .then((res)=>setBoards(res.data))
        .catch(()=>toast.error('Faile to load boards'))
        .finally(()=>setLoading(false))
    },[])

    const handleCreate=async(e)=>{
     e.preventDefault()
     setCreating(true)
     try{
       const res=await boardAPI.create(form)
       setBoards((prev)=>[...prev,res.data])
       setShowModal(false)
       setForm({ title: '', description: '', background: '#0052cc' })
       toast.success('Board created')

     }catch(err){
        setForm({ title: '', description: '', background: '#0052cc' })

     }finally {
      setCreating(false)
    }

    }

    const handleDelete=async(e,id)=>{
        e.stopPropogation()
        if(!confirm('Delete this board?')) return
        try{
            await boardAPI.delete(id)
            setBoards((prev)=>prev.filter((b)=>b._id!==id))
            toast.success('Board deleted')
        }catch{
           toast.error('Failed to delete board')
        }

    }

    const createBoard=async()=>{
        const title=promt("Board name");
        await API.post("/boards",{title});
        fetchBoards();

    }
    return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your projects</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Board
          </button>
        </div>
 
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No boards yet. Create your first one!</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create Board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => navigate(`/board/${board._id}`)}
                className="rounded-xl cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] relative group shadow-sm"
                style={{ backgroundColor: board.background, minHeight: '120px' }}
              >
                <div className="p-4">
                  {/* ✅ FIX: was empty <Link> — now shows board title */}
                  <h3 className="text-white font-semibold text-base">{board.title}</h3>
                  {board.description && (
                    <p className="text-white/70 text-xs mt-1 line-clamp-2">{board.description}</p>
                  )}
                  <p className="text-white/60 text-xs mt-3">
                    {board.members?.length || 1} member{board.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, board._id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/40 text-white rounded-lg p-1.5 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
 
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Create Board</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  className="input"
                  placeholder="e.g. Project Alpha"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="Optional"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c} type="button"
                      onClick={() => setForm({ ...form, background: c })}
                      className={`w-8 h-8 rounded-lg transition-all ${form.background === c ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}