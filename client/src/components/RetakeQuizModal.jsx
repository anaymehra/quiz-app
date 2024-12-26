import React from 'react'
import Modal from 'react-modal'

// Set the app element for accessibility
Modal.setAppElement('#root')

export default function RetakeQuizModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  quizDetails 
}) {
  if (!quizDetails) {
    return null; // Early return if quizDetails is null
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Retake Quiz Modal"
      className="modal"
      overlayClassName="overlay"
    >
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Retake Quiz?</h2>
        <p className="mb-4">You are about to retake a quiz with the following parameters:</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm font-medium text-gray-500">Topic</span>
            <p className="font-semibold text-gray-800">{quizDetails.topic}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Difficulty</span>
            <p className={`font-semibold ${
              quizDetails.difficulty === 'easy' ? 'text-green-600' :
              quizDetails.difficulty === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {quizDetails.difficulty.charAt(0).toUpperCase() + quizDetails.difficulty.slice(1)}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Questions</span>
            <p className="font-semibold text-gray-800">{quizDetails.totalQuestions}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </Modal>
  )
}