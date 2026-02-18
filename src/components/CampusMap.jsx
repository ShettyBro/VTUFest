import React from "react";
import "./CampusMap.css";
import campusMapImage from "../assets/campus-map.png";

const locations = [
   {
    id: 1,
    name: "Main Auditorium",
    top: "42%",
    left: "82%",
    mapUrl: "https://maps.app.goo.gl/LevAPPbwxBt9FfhPA",
  },
  {
    id: 2,
    name: "ANA Block",
    top: "50%",
    left: "90%",
    mapUrl: "https://maps.app.goo.gl/vCnZWMyUV7ZGfwRq6",
  },
  {
    id: 3,
    name: "CSE Block",
    top: "48%",
    left: "77%",
    mapUrl: "https://maps.app.goo.gl/Zunmui1u3Z2GkqiLA",
  },
   {
    id: 4,
    name: "AIGS Block",
    top: "58%",
    left: "78%",
    mapUrl: "https://maps.app.goo.gl/YqU8CKkW17gE2YmL8",
  },
   {
    id: 5,
    name: "Mechanical Block",
    top: "62%",
    left: "68%",
    mapUrl: "https://maps.app.goo.gl/mqZVSCuNdHFCcJxF9",
  },
   {
    id: 6,
    name: "ASD Block",
    top: "72%",
    left: "70%",
    mapUrl: "https://maps.app.goo.gl/R3weEnELzhP3X8uP8",
  },
   {
    id: 7,
    name: "Architecture Block",
    top: "68%",
    left: "60%",
    mapUrl: "https://maps.app.goo.gl/st2R3GxTR9HQDsk77",
  },
   {
    id: 8,
    name: "ECE Block",
    top: "61%",
    left: "47%",
    mapUrl: "https://maps.app.goo.gl/FSokPm7G2ji8F2qCA",
  },
  {
    id: 9,
    name: "Central Library",
    top: "56%",
    left: "58%",
    mapUrl: "https://maps.app.goo.gl/Sd6kestBth8uPAddA",
  },
   {
    id: 10,
    name: "Basketball Court",
    top: "43%",
    left: "63%",
    mapUrl: "https://maps.app.goo.gl/JivncAQiYyuZxDnM7",
  },
   {
    id: 11,
    name: "Student Activity Office",
    top: "30%",
    left: "63%",
    mapUrl: "https://maps.app.goo.gl/pgRScXDp7yhdBiyy6",
  },
  {
    id: 12,
    name: "Stadium",
    top: "40%",
    left: "40%",
    mapUrl: "https://maps.app.goo.gl/Pki5PMWdWpYDFxey9",
  },
  {
    id: 13,
    name: "Udupi Canteen",
    top: "52%",
    left: "30%",
    mapUrl: "https://maps.app.goo.gl/A9pEzM3KWzUwFYdF9",
  },
  {
    id: 15,
    name: "Two-Wheeler Parking",
    top: "41%",
    left: "98%",
    mapUrl: "https://maps.app.goo.gl/F2xDkQBpHrbPtpQq7",
  },
   {
    id: 16,
    name: "Indoor Stadium",
    top: "08%",
    left: "42.1%",
    mapUrl: "https://maps.app.goo.gl/Disy6iC7qoVEZrEZA",
  },
];


export default function CampusMap() {
  return (
    <div className="map-container">
      <img src={campusMapImage} alt="Campus Map" className="campus-map" />

      {locations.map((loc) => (
        <div
          key={loc.id}
          className="map-marker"
          style={{ top: loc.top, left: loc.left }}
          onClick={() => window.open(loc.mapUrl, "_blank")}
        >
          <div className="pin">
            <span>{loc.id}</span>
          </div>
          <span className="pin-label">{loc.name}</span>
        </div>
      ))}
    </div>
  );
}