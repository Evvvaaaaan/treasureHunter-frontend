#!/bin/bash
cat src/styles/profile-page.css | head -n 99 > src/styles/profile-page_new.css
cat << 'INNEREOF' >> src/styles/profile-page_new.css
/* =========================================
   Profile Cards
   ========================================= */
.profile-card-forest,
.profile-card-other-forest {
  background: #1B3D2A;
  border-radius: 24px;
  padding: 28px 24px;
  margin-bottom: 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border: none;
  position: relative;
  overflow: hidden;
}

/* Radar decoration */
.profile-card-radar {
  position: absolute;
  top: 0;
  right: -30px;
  width: 240px;
  height: 240px;
  pointer-events: none;
  opacity: 0.8;
}

/* Card header: avatar + info + edit button in one row */
.profile-card-header-forest,
.profile-card-header-other-forest {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  position: relative;
  z-index: 2;
}

.profile-avatar-forest,
.profile-avatar-other-forest {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar-forest img,
.profile-avatar-other-forest img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #F5F2E8;
  background-color: #83A892;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.online-badge-forest {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--c-accent);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  border: 3px solid #1B3D2A;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.profile-header-info,
.profile-header-info-other {
  flex: 1;
}

.profile-header-info h2,
.profile-header-info-other h2 {
  font-size: 1.375rem;
  font-weight: 700;
  color: #F5F2E8;
  margin: 0 0 6px 0;
  letter-spacing: -0.01em;
}

.profile-role,
.profile-role-other {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #83A892;
  letter-spacing: 0.05em;
  margin: 0;
}

/* =========================================
   Buttons
   ========================================= */
.edit-btn-forest,
.edit-actions-inline button {
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn-forest {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #F5F2E8;
  backdrop-filter: blur(4px);
}

.edit-btn-forest:hover {
  background: rgba(255, 255, 255, 0.25);
  color: #F5F2E8;
}

.save-btn-forest {
  background: var(--c-primary);
  color: white;
  border: none;
}

.cancel-btn-forest {
  background: rgba(15, 61, 46, 0.05);
  border: 1px solid rgba(15, 61, 46, 0.1);
  color: var(--c-primary);
}

.edit-avatar-btn-forest {
  position: absolute;
  bottom: 0;
  right: -4px;
  width: 32px;
  height: 32px;
  background: var(--c-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  border: 2px solid #F5F2E8;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

/* =========================================
   Trust Score
   ========================================= */
.trust-score-section,
.trust-score-section-other {
  margin-bottom: 24px;
  position: relative;
  z-index: 2;
}

.trust-score-label,
.trust-score-label-other {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #83A892;
  letter-spacing: 0.05em;
}

.trust-score-value,
.trust-score-value-other {
  color: #F5F2E8;
  font-size: 1rem;
}

.trust-score-bar-forest,
.trust-score-bar-other-forest {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.trust-score-fill-forest,
.trust-score-fill-other-forest {
  height: 100%;
  background: #83A892;
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* =========================================
   Stats Grid
   ========================================= */
.stats-grid-forest,
.stats-grid-other-forest {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: transparent;
  padding: 0;
  border-radius: 0;
  position: relative;
  z-index: 2;
}

.stat-item-forest,
.stat-item-other-forest {
  text-align: center;
}

.stat-number,
.stat-number-other {
  display: block;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.5rem;
  font-weight: 800;
  color: #F5F2E8;
  margin-bottom: 6px;
}

.stat-label,
.stat-label-other-small {
  font-size: 0.75rem;
  font-weight: 500;
  color: #83A892;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
INNEREOF
cat src/styles/profile-page.css | tail -n +375 >> src/styles/profile-page_new.css
mv src/styles/profile-page_new.css src/styles/profile-page.css
