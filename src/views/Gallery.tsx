import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { GalleryItem } from "../types";
import { Image as ImageIcon, Plus, Heart, Calendar, Upload, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Masonry from 'react-masonry-css';

export default function Gallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newImage, setNewImage] = useState({ title: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Check for new memories occasionally
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const g = await api.gallery.getAll();
      setGallery(g);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Upload the file
      const { url } = await api.upload(selectedFile);
      
      // 2. Add to gallery database
      await api.gallery.add({
        title: newImage.title,
        image_url: url
      });

      setShowModal(false);
      setNewImage({ title: "" });
      setSelectedFile(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    768: 2,
    500: 2
  };

  return (
    <div className="pb-16 lg:pb-0 space-y-6 md:space-y-8">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Memories</h2>
          <p className="text-gray-400 mt-1 flex items-center text-xs md:text-sm font-medium">
            <Heart size={14} className="mr-2 text-rose-400 fill-rose-400" />
            Capture and preserve your family moments.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center bg-rose-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all font-bold"
        >
          <Plus size={24} className="mr-2" />
          New Moment
        </button>
      </div>

      <div className="px-2">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {gallery.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={item.id}
              className="group relative bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              <div className="w-full overflow-hidden bg-gray-100 min-h-[100px]">
                {item.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <div className="relative">
                    <video 
                      src={item.image_url} 
                      className="w-full h-full object-cover"
                      controls={false}
                      muted
                      loop
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                      <Play size={16} fill="white" />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop';
                    }}
                  />
                )}
              </div>
              
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-white font-black text-xs md:text-sm leading-tight mb-1 uppercase tracking-wider truncate">{item.title || "Untitled Moment"}</h4>
                <div className="flex items-center text-white/70 text-[9px] font-black uppercase tracking-widest">
                  <span className="truncate">{item.user_name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </Masonry>

        {gallery.length === 0 && (
          <div className="col-span-full py-24 md:py-40 flex flex-col items-center justify-center bg-gray-50/50 rounded-[40px] border-4 border-dashed border-gray-100">
             <div className="p-4 md:p-6 bg-rose-50 text-rose-300 rounded-full mb-6">
                <ImageIcon size={48} className="md:w-16 md:h-16" />
             </div>
             <p className="text-lg md:text-xl font-bold text-gray-400">No moments shared yet.</p>
             <button 
               onClick={() => setShowModal(true)}
               className="mt-4 text-rose-600 font-black uppercase tracking-widest text-xs hover:underline"
             >
               Start sharing memories
             </button>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-rose-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform shadow-rose-200"
      >
        <Plus size={32} />
      </button>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white rounded-t-[40px] md:rounded-[40px] shadow-2xl p-10 max-w-md w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-indigo-500" />
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full transition-all"
            >
              <Plus size={24} className="rotate-45" />
            </button>
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 mb-1">New Memory</h3>
              <p className="text-gray-400 text-sm font-medium">Upload a photo to the family gallery.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Moment Title</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-rose-500 font-bold"
                  placeholder="What was this time?"
                  value={newImage.title}
                  onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Media / Image</label>
                <div className="relative group">
                  <input
                    required
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full min-h-[140px] bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px] cursor-pointer hover:bg-rose-50 hover:border-rose-200 transition-all group"
                  >
                    {!selectedFile ? (
                      <>
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 group-hover:text-rose-500 group-hover:scale-110 transition-all mb-3">
                          <Upload size={24} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-tighter text-gray-400">Select File</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center p-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl mb-3">
                          <ImageIcon size={24} />
                        </div>
                        <p className="text-xs font-bold text-gray-800 text-center truncate max-w-[200px]">{selectedFile.name}</p>
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                          className="mt-2 text-[10px] font-black uppercase tracking-widest text-rose-500"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-rose-100 hover:bg-rose-700 transition-all mt-4 uppercase tracking-[0.2em] flex items-center justify-center disabled:opacity-50 disabled:bg-gray-200"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={24} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Share Moment"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
