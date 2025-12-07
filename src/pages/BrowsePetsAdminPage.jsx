import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { getAllPets, addPet, updatePet, deletePet, uploadPetImage } from "../lib/pets";
import AddPetModal from "../components/AddPetModal";
import EditPetModal from "../components/EditPetModal";
import Toast from "../components/Toast";
import Button from "../components/Button";
import PetCard from "../components/PetCard";

export default function BrowsePetsAdminPage() {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  const fetchPets = async () => {
    setLoading(true);
    setError("");
    const result = await getAllPets();
    
    if (result.success) {
      setPets(result.pets);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Load pets on mount
  useEffect(() => {
    const loadPets = async () => {
      setLoading(true);
      setError("");
      const result = await getAllPets();
      
      if (result.success) {
        setPets(result.pets);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    loadPets();
  }, []);

  // Filter pets
  useEffect(() => {
    let filtered = pets;

    if (search) {
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(search.toLowerCase()) ||
          (pet.breed && pet.breed.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((pet) => pet.category === selectedCategory);
    }

    setFilteredPets(filtered);
  }, [search, selectedCategory, pets]);

  const handleAddPetSubmit = async (petData, imageFile) => {
    setToast({ message: "", type: "info" });

    setLoading(true);
    let imageUrl = "";

    // Upload image if provided
    if (imageFile) {
      const uploadResult = await uploadPetImage(imageFile, `temp-${Date.now()}`);
      if (uploadResult.success) {
        imageUrl = uploadResult.imageUrl;
      } else {
        setToast({ message: "Image upload failed: " + uploadResult.error, type: "error" });
        setLoading(false);
        return;
      }
    }

    const petDataWithImage = { ...petData, image_url: imageUrl };
    const result = await addPet(petDataWithImage, null);

    if (result.success) {
      setToast({ message: "Pet added successfully!", type: "success" });
      setIsAddModalOpen(false);
      const reload = async () => {
        const res = await getAllPets();
        if (res.success) {
          setPets(res.pets);
        }
      };
      reload();
    } else {
      setToast({ message: result.error || "Failed to add pet.", type: "error" });
    }

    setLoading(false);
  };

  const handleEditPetSubmit = async (petData, imageFile) => {
    setToast({ message: "", type: "info" });

    setLoading(true);
    let imageUrl = petData.image_url;

    // Upload new image if changed
    if (imageFile) {
      const uploadResult = await uploadPetImage(imageFile, petData.id);
      if (uploadResult.success) {
        imageUrl = uploadResult.imageUrl;
      } else {
        setToast({ message: "Image upload failed: " + uploadResult.error, type: "error" });
        setLoading(false);
        return;
      }
    }

    // Use updatePet to update existing pet record
    const result = await updatePet(selectedPet.id, { ...petData, image_url: imageUrl });

    if (result.success) {
      setToast({ message: "Pet updated!", type: "success" });
      setIsEditModalOpen(false);
      setSelectedPet(null);
      fetchPets();
    } else {
      setToast({ message: result.error || "Failed to update pet.", type: "error" });
    }

    setLoading(false);
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm("Are you sure you want to delete this pet?")) {
      return;
    }

    setLoading(true);
    const result = await deletePet(petId);

    if (result.success) {
      setToast({ message: "Pet deleted successfully!", type: "success" });
      fetchPets();
    } else {
      setToast({ message: result.error || "Failed to delete pet.", type: "error" });
    }

    setLoading(false);
  };

  return (
    <AdminLayout>
      <div style={{ backgroundColor: "var(--white)", minHeight: "100vh" }}>
        {/* Header Section */}
        <div style={{ backgroundColor: "var(--primary-beige)", padding: "3rem 1.5rem" }}>
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <p style={{ color: "var(--accent-dark)", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                🐾 MANAGE INVENTORY
              </p>
              <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                Pet Management
              </h1>
              <p style={{ color: "var(--text-light)", fontSize: "1.125rem" }}>
                View, edit, and add pets to the shelter
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} variant="primary" className="px-6 py-3">
              ➕ Add Pet
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-8" style={{ maxWidth: "1400px", margin: "0 auto" }}>

        {/* Messages */}
        {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />}

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name or breed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="dog">🐕 Dogs</option>
            <option value="cat">🐱 Cats</option>
            <option value="bird">🦜 Birds</option>
            <option value="rabbit">🐰 Rabbits</option>
          </select>
          <Button onClick={fetchPets} variant="secondary" className="font-semibold">
            🔄 Refresh
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <p style={{ color: "var(--text-light)" }}>Loading pets...</p>
        )}

        {/* Pets Grid */}
        {!loading && filteredPets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <PetCard 
                key={pet.id} 
                pet={pet} 
                onEdit={(p) => {
                  setSelectedPet(p);
                  setIsEditModalOpen(true);
                }}
                onDelete={handleDeletePet}
                showDeleteButton={true}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPets.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">🔍</p>
            <p style={{ color: "var(--text-light)" }}>
              No pets found. Try adjusting your filters or add a new pet.
            </p>
          </div>
        )}

        {/* Add Pet Modal */}
        <AddPetModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddPetSubmit}
          loading={loading}
        />

        {/* Edit Pet Modal */}
        <EditPetModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          pet={selectedPet}
          onSubmit={handleEditPetSubmit}
          loading={loading}
        />
        </div>
      </div>
    </AdminLayout>
  );
}
