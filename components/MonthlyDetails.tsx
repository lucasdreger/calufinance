import { useEffect, useState } from 'react'
// ...existing code...

export default function MonthlyDetails({ userId }: Props) {
  const [completedTasks, setCompletedTasks] = useState(0)
  const [totalTasks, setTotalTasks] = useState(0)

  useEffect(() => {
    // Count all checkboxes on the page
    const checkboxes = document.querySelectorAll('input[type="checkbox"]')
    setTotalTasks(checkboxes.length)
    
    // Count initially checked boxes
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked')
    setCompletedTasks(checkedBoxes.length)
  }, [])

  // Update completed count when checkboxes change
  const handleCheckboxChange = () => {
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked')
    setCompletedTasks(checkedBoxes.length)
  }

  return (
    <div>
      <div className="text-sm text-gray-500 mb-4">
        {completedTasks} of {totalTasks} tasks completed
      </div>
      {/* Add onChange handler to your checkboxes */}
      <input 
        type="checkbox"
        onChange={handleCheckboxChange}
        // ...other props
      />
      // ...existing code...
    </div>
  )
}
