import React from 'react';
import { useContext } from 'react';
import { SelectionContext } from '../hooks/useSelection';
import styles from './SelectionFooter.module.css';

export const SelectionFooter: React.FC = () => {
  const { getSelectedIds, clearSelection, selectionCount } = useContext(SelectionContext);

  // No need to render if nothing is selected
  if (selectionCount === 0) {
    return null;
  }

  const handleDownload = async () => {
    try {
      // Get the array of selected meme IDs using the getter method
      const selectedIds = getSelectedIds();
      
      // Create a request to download the selected memes
      const response = await fetch('/api/memes/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header if available
      let filename = 'selected-memes.zip';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/["']/g, '');
        }
      }
      
      // Create a temporary link and click it to download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading memes:', error);
      alert('Failed to download memes');
    }
  };

  return (
    <div className={styles.selectionFooter}>
      <div className={styles.footerContent}>
        <button
          className={styles.actionButton}
          onClick={clearSelection}
        >
          Unselect All
        </button>
        <button
          className={styles.actionButton}
          onClick={handleDownload}
        >
          Download {selectionCount} Meme{selectionCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};
