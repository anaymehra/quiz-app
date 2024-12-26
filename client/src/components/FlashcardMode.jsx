"use client";

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Brain,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { CODING_CONCEPTS } from "../codingConcepts.js";
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function FlashcardMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [inputTopic, setInputTopic] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.state?.flashcards && location.state?.topic) {
      setFlashcards(location.state.flashcards);
      setTopic(location.state.topic);
    }
  }, [location.state]);

  const generateFlashcards = async (topicToUse) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_URL}/flashcards/generate`,
        {
          topic: topicToUse,
          count: 10,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFlashcards(response.data.flashcards);
      setTopic(response.data.topic);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      setError("Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTopic.trim()) {
      generateFlashcards(inputTopic.trim());
    }
  };

  const handleRandomTopic = () => {
    const randomTopic =
      CODING_CONCEPTS[Math.floor(Math.random() * CODING_CONCEPTS.length)];
    setInputTopic(randomTopic);
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-200 pt-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quick Flashcards
          </h1>
          <p className="text-gray-600">Enter a topic to generate flashcards</p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label
                htmlFor="topic"
                className="block text-lg font-medium text-gray-700"
              >
                What would you like to study?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="topic"
                  value={inputTopic}
                  onChange={(e) => setInputTopic(e.target.value)}
                  className="flex-grow px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g. JavaScript Promises"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleRandomTopic}
                  className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-xl"
                >
                  <Sparkles className="h-5 w-5" />
                  Random
                </button>
                <button
                  type="submit"
                  disabled={!inputTopic.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="h-5 w-5" />
                  Generate
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {flashcards.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 md:p-8 border border-blue-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Topic: {topic}
              </h2>
              <p className="text-gray-600">
                Card {currentCardIndex + 1} of {flashcards.length}
              </p>
            </div>

            <div
              className="relative h-64 w-full perspective-1000 cursor-pointer mb-8"
              onClick={handleFlip}
            >
              <motion.div
                className="w-full h-full rounded-xl shadow-md"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                style={{
                  transformStyle: "preserve-3d",
                  transition: "transform 0.1s", // Faster flip
                }}
              >
                {/* Front side (Question) */}
                <div
                  className="absolute inset-0 w-full h-full backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300">
                    <h2 className="text-2xl font-bold text-yellow-700 text-center">
                      Question
                    </h2>
                    <p className="mt-4 text-lg font-medium text-yellow-800 text-center">
                      {flashcards[currentCardIndex]?.question}
                    </p>
                  </div>
                </div>
                {/* Back side (Answer) */}
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-300">
                    <h2 className="text-2xl font-bold text-green-700 text-center">
                      Answer
                    </h2>
                    <p className="mt-4 text-lg font-medium text-green-800 text-center">
                      {flashcards[currentCardIndex]?.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handlePreviousCard}
                disabled={currentCardIndex === 0}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleFlip}
                className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all duration-200"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextCard}
                disabled={currentCardIndex === flashcards.length - 1}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
