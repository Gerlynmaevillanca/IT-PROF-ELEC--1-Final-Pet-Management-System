import React from 'react';
import Button from './Button';

export default function PetCard({ pet, onEdit, onDelete, showDeleteButton = false }) {
  return (
    <div className="pet-card shadow-sm rounded-lg overflow-hidden border bg-white">
      {pet.image_url ? (
        <img src={pet.image_url} alt={pet.name} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 flex items-center justify-center bg-amber-100 text-4xl">
          {pet.category === 'dog' && '🐕'}
          {pet.category === 'cat' && '🐱'}
          {pet.category === 'bird' && '🦜'}
          {pet.category === 'rabbit' && '🐰'}
          {!pet.category && '🐾'}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
            <p className="text-sm text-gray-500">{pet.breed || 'Unknown breed'}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${pet.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
            {pet.status}
          </span>
        </div>

        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <div><strong>Category:</strong> {pet.category || '—'}</div>
          {pet.age && <div><strong>Age:</strong> {pet.age}</div>}
          {pet.gender && <div><strong>Gender:</strong> {pet.gender}</div>}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="primary" className="flex-1 text-sm" onClick={() => onEdit && onEdit(pet)}>
            Edit
          </Button>
          {showDeleteButton && (
            <Button variant="ghost" className="flex-1 text-sm text-red-600 hover:bg-red-50" onClick={() => onDelete && onDelete(pet.id)}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
