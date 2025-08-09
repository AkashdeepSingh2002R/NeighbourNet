import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const initialRentals = [
  {
    id: 1,
    price: 1600,
    address: '12 Oak St, M1V 1A2',
    community: 'Eco Warriors',
    image: '/rentals/house1.jpg',
    description: 'Spacious detached house with garden. Ideal for families.',
  },
  {
    id: 2,
    price: 1200,
    address: '34 Maple Ave, M1V 1A2',
    community: 'Food Share Club',
    image: '/rentals/house2.jpg',
    description: 'Beautiful townhouse near local park.',
  },
];

export default function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const stored = JSON.parse(localStorage.getItem('user_rentals')) || [];
  const allRentals = [...initialRentals, ...stored];
  const rental = allRentals.find((r) => r.id === parseInt(id));

  if (!rental) {
    return (
      <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
        
        <main className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-bold">Rental Not Found</h2>
          <p className="mt-2 text-sm">Sorry, this rental doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-4 py-2 bg-[#f8d878] rounded text-[#2f4430]"
          >
            Go Back
          </button>
        </main>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-lg shadow p-6">
          <img
            src={rental.image}
            alt={rental.address}
            className="w-full h-64 object-cover rounded mb-6"
          />
          <h2 className="text-3xl font-bold mb-2">${rental.price}/month</h2>
          <p className="text-md mb-1 font-medium">{rental.address}</p>
          <p className="text-sm text-[#5d6d5d] mb-4">{rental.community}</p>
          <p className="text-md">{rental.description}</p>

          <button
            onClick={() => navigate(-1)}
            className="mt-8 px-4 py-2 bg-[#f8d878] hover:bg-[#f5ca4e] text-[#2f4430] rounded"
          >
            Back to Rentals
          </button>
        </div>
      </main>
      
    </div>
  );
}
