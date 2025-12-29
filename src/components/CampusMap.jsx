import React from "react";
import "./CampusMap.css";
import campusMapImage from "../assets/campus-map.png";

const locations = [
  {
    id: 1,
    name: "Main Auditorium",
    top: "52%",
    left: "78%",
    mapUrl: "https://maps.app.goo.gl/LevAPPbwxBt9FfhPA",
  },
  {
    id: 2,
    name: "ANA Block",
    top: "59%",
    left: "85%",
    mapUrl: "https://maps.app.goo.gl/vCnZWMyUV7ZGfwRq6",
  },
  {
    id: 3,
    name: "CSE Block",
    top: "57%",
    left: "74%",
    mapUrl: "https://maps.app.goo.gl/Zunmui1u3Z2GkqiLA",
  },
   {
    id: 4,
    name: "AIGS Block",
    top: "65%",
    left: "75%",
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
    top: "75%",
    left: "63%",
    mapUrl: "https://maps.app.goo.gl/st2R3GxTR9HQDsk77",
  },
   {
    id: 8,
    name: "ECE Block",
    top: "68%",
    left: "50%",
    mapUrl: "https://maps.app.goo.gl/FSokPm7G2ji8F2qCA",
  },
  {
    id: 9,
    name: "Central Library",
    top: "64%",
    left: "58%",
    mapUrl: "https://maps.app.goo.gl/Sd6kestBth8uPAddA",
  },
   {
    id: 10,
    name: "Basketball Court",
    top: "55%",
    left: "62%",
    mapUrl: "https://maps.app.goo.gl/JivncAQiYyuZxDnM7",
  },
   {
    id: 11,
    name: "Student Activity Office",
    top: "44%",
    left: "60.5%",
    mapUrl: "https://maps.app.goo.gl/pgRScXDp7yhdBiyy6",
  },
  {
    id: 12,
    name: "Stadium",
    top: "50%",
    left: "43%",
    mapUrl: "https://maps.app.goo.gl/Pki5PMWdWpYDFxey9",
  },
  {
    id: 13,
    name: "Udupi Canteen",
    top: "59%",
    left: "32%",
    mapUrl: "https://maps.app.goo.gl/A9pEzM3KWzUwFYdF9",
  },
  {
    id: 14,
    name: "Snacks Lab Cafeteria",
    top: "50%",
    left: "73%",
    mapUrl: "https://maps.app.goo.gl/FgXUJKYgPBAM9MJG6",
  },
  {
    id: 15,
    name: "Two-Wheeler Parking",
    top: "50%",
    left: "93%",
    mapUrl: "https://maps.app.goo.gl/FgXUJKYgPBAM9MJG6",
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