import React, { useState, useEffect } from 'react'
import { FaArrowUp } from "@react-icons/all-files/fa/FaArrowUp"
import styles from "./styles.module.css"

const MoveToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    };

    window.addEventListener('scroll', toggleVisibility)

    // Clean up the event listener on unmount
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {isVisible && (
        <button onClick={scrollToTop} className={styles['move-to-top-btn']}>
            <FaArrowUp />
        </button>
      )}
    </>
  )
}

export default MoveToTopButton;