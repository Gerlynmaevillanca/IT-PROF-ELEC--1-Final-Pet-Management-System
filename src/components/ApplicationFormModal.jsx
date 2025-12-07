import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ApplicationFormModal({ isOpen, onClose, pet, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    living_situation: '',
    home_type: '',
    rent_or_own: '',
    landlord_allows_pets: '',
    household_members: '',
    children_ages: '',
    other_pets_description: '',
    reason_for_adoption: '',
    daily_schedule: '',
    veterinary_reference: '',
    personal_reference: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        living_situation: '',
        home_type: '',
        rent_or_own: '',
        landlord_allows_pets: '',
        household_members: '',
        children_ages: '',
        other_pets_description: '',
        reason_for_adoption: '',
        daily_schedule: '',
        veterinary_reference: '',
        personal_reference: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.living_situation.trim()) newErrors.living_situation = 'Living situation is required';
    if (!formData.home_type.trim()) newErrors.home_type = 'Home type is required';
    if (!formData.rent_or_own.trim()) newErrors.rent_or_own = 'Please select rent or own';
    if (formData.rent_or_own === 'rent' && !formData.landlord_allows_pets) {
      newErrors.landlord_allows_pets = 'Required for renters';
    }
    if (!formData.household_members) newErrors.household_members = 'Household members is required';
    if (!formData.reason_for_adoption.trim()) newErrors.reason_for_adoption = 'Reason for adoption is required';
    if (!formData.daily_schedule.trim()) newErrors.daily_schedule = 'Daily schedule is required';
    if (!formData.veterinary_reference.trim()) newErrors.veterinary_reference = 'Veterinary reference is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Apply for ${pet?.name || 'Pet'}`} width={700} height="auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Living Situation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Living Situation *</label>
          <textarea
            name="living_situation"
            value={formData.living_situation}
            onChange={handleChange}
            placeholder="Describe your living situation (e.g., apartment, house, farm)"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.living_situation ? 'border-red-500' : 'border-gray-300'
            }`}
            rows="2"
          />
          {errors.living_situation && <p className="text-red-500 text-xs mt-1">{errors.living_situation}</p>}
        </div>

        {/* Home Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Home Type *</label>
          <select
            name="home_type"
            value={formData.home_type}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.home_type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">-- Select Home Type --</option>
            <option value="House">House</option>
            <option value="Apartment">Apartment</option>
            <option value="Condo">Condo</option>
            <option value="Farm">Farm</option>
            <option value="Other">Other</option>
          </select>
          {errors.home_type && <p className="text-red-500 text-xs mt-1">{errors.home_type}</p>}
        </div>

        {/* Rent or Own */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rent or Own *</label>
          <select
            name="rent_or_own"
            value={formData.rent_or_own}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.rent_or_own ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">-- Select --</option>
            <option value="own">Own</option>
            <option value="rent">Rent</option>
          </select>
          {errors.rent_or_own && <p className="text-red-500 text-xs mt-1">{errors.rent_or_own}</p>}
        </div>

        {/* Landlord Allows Pets (if renting) */}
        {formData.rent_or_own === 'rent' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Allows Pets *</label>
            <select
              name="landlord_allows_pets"
              value={formData.landlord_allows_pets}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                errors.landlord_allows_pets ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select --</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="pending">Pending Approval</option>
            </select>
            {errors.landlord_allows_pets && (
              <p className="text-red-500 text-xs mt-1">{errors.landlord_allows_pets}</p>
            )}
          </div>
        )}

        {/* Household Members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Household Members *</label>
          <input
            type="number"
            name="household_members"
            value={formData.household_members}
            onChange={handleChange}
            placeholder="Number of people in household"
            min="1"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.household_members ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.household_members && <p className="text-red-500 text-xs mt-1">{errors.household_members}</p>}
        </div>

        {/* Children Ages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Children Ages (if any)</label>
          <input
            type="text"
            name="children_ages"
            value={formData.children_ages}
            onChange={handleChange}
            placeholder="e.g., 5, 8, 12 (leave blank if no children)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Other Pets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Other Pets Description</label>
          <textarea
            name="other_pets_description"
            value={formData.other_pets_description}
            onChange={handleChange}
            placeholder="Describe any other pets you have"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            rows="2"
          />
        </div>

        {/* Reason for Adoption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Adoption *</label>
          <textarea
            name="reason_for_adoption"
            value={formData.reason_for_adoption}
            onChange={handleChange}
            placeholder="Why do you want to adopt this pet?"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.reason_for_adoption ? 'border-red-500' : 'border-gray-300'
            }`}
            rows="2"
          />
          {errors.reason_for_adoption && (
            <p className="text-red-500 text-xs mt-1">{errors.reason_for_adoption}</p>
          )}
        </div>

        {/* Daily Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Daily Schedule *</label>
          <textarea
            name="daily_schedule"
            value={formData.daily_schedule}
            onChange={handleChange}
            placeholder="Describe a typical day for the pet (e.g., alone 8 hours for work, etc.)"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.daily_schedule ? 'border-red-500' : 'border-gray-300'
            }`}
            rows="2"
          />
          {errors.daily_schedule && <p className="text-red-500 text-xs mt-1">{errors.daily_schedule}</p>}
        </div>

        {/* Veterinary Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Veterinary Reference (Name & Contact) *</label>
          <input
            type="text"
            name="veterinary_reference"
            value={formData.veterinary_reference}
            onChange={handleChange}
            placeholder="Vet name and phone number"
            className={`w-full px-3 py-2 border rounded-md text-sm ${
              errors.veterinary_reference ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.veterinary_reference && (
            <p className="text-red-500 text-xs mt-1">{errors.veterinary_reference}</p>
          )}
        </div>

        {/* Personal Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Personal Reference (Name & Contact)</label>
          <input
            type="text"
            name="personal_reference"
            value={formData.personal_reference}
            onChange={handleChange}
            placeholder="Reference name and phone number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
