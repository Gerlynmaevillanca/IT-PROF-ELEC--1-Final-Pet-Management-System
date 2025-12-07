import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { uploadPetImage } from '../lib/pets';

export default function EditPetModal({ isOpen, onClose, pet, onSubmit, loading = false }) {
  const [imageFile, setImageFile] = useState(null);
  const [petData, setPetData] = useState({
    name: '',
    breed: '',
    category: '',
    age: '',
    gender: '',
    size: '',
    color: '',
    description: '',
    health_status: 'healthy',
    vaccination_status: 'false',
    neutered_spayed: 'false',
    status: 'Available',
    image_url: '',
    _preview: '',
  });

  useEffect(() => {
    if (pet) {
      setPetData({
        ...pet,
        neutered_spayed: pet.neutered_spayed ? 'true' : 'false',
        health_status: pet.health_status || 'healthy',
        _preview: pet.image_url,
      });
      setImageFile(null);
    }
  }, [pet, isOpen]);

  const handleChange = (e) => {
    setPetData({ ...petData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      try {
        const previewUrl = URL.createObjectURL(file);
        setPetData({ ...petData, _preview: previewUrl });
      } catch (err) {
        // ignore
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(petData, imageFile);
  };

  return (
    <Modal open={isOpen} onClose={onClose} width="700px" height="auto">
      <h2 className="text-2xl font-bold text-amber-700 mb-6">Edit Pet</h2>
      {petData && (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Row 1: Name and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Pet Name *</label>
              <input
                type="text"
                name="name"
                value={petData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Category *</label>
              <select
                name="category"
                value={petData.category}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select category...</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
              </select>
            </div>
          </div>

          {/* Row 2: Breed and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Breed</label>
              <input
                type="text"
                name="breed"
                value={petData.breed}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Gender</label>
              <select
                name="gender"
                value={petData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Row 3: Age and Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Age</label>
              <input
                type="text"
                name="age"
                value={petData.age}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Size</label>
              <select
                name="size"
                value={petData.size}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select size...</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra large">Extra Large</option>
              </select>
            </div>
          </div>

          {/* Row 4: Color */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Color</label>
            <input
              type="text"
              name="color"
              value={petData.color}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Row 5: Health and Vaccination Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Health Status</label>
              <select
                name="health_status"
                value={petData.health_status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="healthy">Healthy</option>
                <option value="sick">Sick</option>
                <option value="recovering">Recovering</option>
                <option value="special_needs">Special Needs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Vaccination Status</label>
              <select
                name="vaccination_status"
                value={petData.vaccination_status || 'false'}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="false">Not Vaccinated</option>
                <option value="true">Vaccinated</option>
              </select>
            </div>
          </div>

          {/* Row 6: Neutered/Spayed */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Neutered / Spayed</label>
            <select
              name="neutered_spayed"
              value={petData.neutered_spayed}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="false">Incomplete (False)</option>
              <option value="true">Complete (True)</option>
            </select>
          </div>

          {/* Row 7: Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
            <textarea
              name="description"
              value={petData.description}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Row 8: Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Pet Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border rounded"
            />
            {imageFile && (
              <div className="mt-2 flex gap-4 items-center">
                <p className="text-sm text-green-600">✓ {imageFile.name} selected</p>
                {petData._preview && (
                  <img src={petData._preview} alt="preview" className="w-32 h-24 object-cover rounded border" />
                )}
              </div>
            )}
            {!imageFile && petData._preview && (
              <div className="mt-2">
                <img src={petData._preview} alt="preview" className="w-32 h-24 object-cover rounded border" />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 py-3 font-semibold"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-3 font-semibold"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
