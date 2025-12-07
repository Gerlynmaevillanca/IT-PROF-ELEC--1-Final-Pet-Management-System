/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailablePets } from "../lib/pets";
import { Search, Heart } from "lucide-react";
import GuestHeader from "../components/GuestHeader";

export default function LandingPage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchPets = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAvailablePets();
      if (result && result.success) setPets(result.pets || []);
      else setError(result?.error || "Failed to load pets");
    } catch (err) {
      setError("Failed to load pets");
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    let filtered = pets.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.breed || "").toLowerCase().includes(q));
    }
    if (selectedCategory) filtered = filtered.filter((p) => p.category === selectedCategory);
    if (selectedStatus) filtered = filtered.filter((p) => p.status === selectedStatus);
    setFilteredPets(filtered);
  }, [pets, search, selectedCategory, selectedStatus]);

  const handlePetClick = (id) => navigate(`/pet/${id}`);

  return (
    <>
      <GuestHeader />
      <div className="min-h-screen bg-dark pt-16">
        {/* Hero */}
        <div className="bg-linear-amber px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Search size={16} className="text-white" />
              <span className="text-sm font-bold text-white">FIND PETS</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white mb-4">Find Your Perfect Pet</h1>
            <p className="text-xl text-white/90">Browse our available pets and find your new best friend</p>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <input
                    className="w-full px-6 py-4 rounded-xl border border-gray-200 bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                    placeholder="Search by name or breed..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500">
                    <Search size={18} />
                  </div>
                </div>
              </div>

              <select
                className="px-6 py-4 rounded-xl border border-gray-200 bg-white"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Dog">🐕 Dogs</option>
                <option value="Cat">🐱 Cats</option>
                <option value="Bird">🦜 Birds</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select className="w-full p-2 border rounded" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="Dog">🐕 Dogs</option>
                  <option value="Cat">🐱 Cats</option>
                  <option value="Bird">🦜 Birds</option>
                  <option value="Rabbit">🐰 Rabbits</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select className="w-full p-2 border rounded" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Actions</label>
                <button className="btn-secondary w-full font-semibold p-2 rounded" onClick={fetchPets}>🔄 Refresh</button>
              </div>

              <div />
            </div>

            {/* Messages */}
            {error && <div className="alert-error">{error}</div>}
            {loading && <div className="text-center py-12 text-amber-700">Loading pets...</div>}

            {/* Pets Grid */}
            {!loading && filteredPets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPets.map((pet) => (
                  <div key={pet.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:translate-y-1 transition-transform" onClick={() => handlePetClick(pet.id)}>
                    {pet.image_url ? (
                      <img src={pet.image_url} alt={pet.name} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="h-48 bg-linear-amber-br flex items-center justify-center text-6xl">
                        {pet.category === "Dog" ? "🐕" : pet.category === "Cat" ? "🐱" : pet.category === "Bird" ? "🦜" : "🐾"}
                      </div>
                    )}

                    <div className="p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-2xl font-semibold text-amber-900">{pet.name}</h3>
                        <Heart size={22} className="text-amber-400 hover:text-red-500 cursor-pointer transition-colors" />
                      </div>
                      <div className="space-y-1 text-sm text-amber-700">
                        <p><strong>Category:</strong> {pet.category}</p>
                        <p><strong>Breed:</strong> {pet.breed}</p>
                        <p><strong>Age:</strong> {pet.age}</p>
                      </div>
                      <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">{pet.status}</span>
                      <div className="pt-2">
                        <button className="w-full py-3 rounded-xl font-semibold bg-linear-amber text-white hover:shadow-md transition-all" onClick={(e) => { e.stopPropagation(); handlePetClick(pet.id); }}>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>  
  );
}
 
