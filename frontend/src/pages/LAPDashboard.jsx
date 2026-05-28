import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Relative paths restored
import { useAuth } from "../context/AuthContext";
import { useApplicants } from "../context/ApplicantContext";
import { usePasscode } from "../hooks/usePasscode";
import PasscodeModal from "../components/shared/PasscodeModal";
import PipelinePanel from "../components/lap/PipelinePanel";
import WorkspacePanel from "../components/lap/WorkspacePanel";
import NewApplicantModal from "../components/applicant/NewApplicantModal";
import CibilPanel from "../components/lap/CibilPanel";
import { LAP_STAGES } from "../utils/finance";

const LAPDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const {
    applicants,
    activeApplicant,
    loading: dataLoading,
    fetchApplicants,
    selectApplicant,
    advanceStage,
  } = useApplicants();
  const passcode = usePasscode();

  const [workspaceMode, setWorkspaceMode] = useState("edit");
  const [navStep, setNavStep] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchApplicants({ disbursed: false });
  }, [user, fetchApplicants]);

  useEffect(() => {
    if (activeApplicant) setNavStep(activeApplicant.stage);
  }, [activeApplicant]);

  const handleSelectApplicant = useCallback(
    async (id, mode = "edit") => {
      await selectApplicant(id);
      setWorkspaceMode(mode);
    },
    [selectApplicant],
  );

  const handleStageAdvance = useCallback(
    async (applicantId) => {
      const app = applicants.find((a) => a._id === applicantId);
      if (!app) return;

      if (!app.cibil || !app.otpVerified || !app.faceVerified) {
        toast.error("Complete CIBIL pull and biometric verification first");
        return;
      }

      const nextStage = LAP_STAGES[app.stage + 1];
      if (!nextStage) return;

      const ok = await passcode.ask(
        `Stage Clearance — ${app.name}`,
        `Advancing stage. Enter supervisor passcode to authorize.`,
        "🔐",
      );

      if (!ok) return;

      if (app.stage === 3) {
        await advanceStage(applicantId);
        navigate("/minting", { state: { lapApplicantId: applicantId } });
      } else {
        await advanceStage(applicantId);
      }
    },
    [applicants, passcode, advanceStage, navigate],
  );

  const handleNavTo = (step) => {
    if (!activeApplicant) return;
    if (step > activeApplicant.stage) {
      toast.error("Complete current stage first");
      return;
    }
    setNavStep(step);
  };

  if (authLoading)
    return <div className="loading-screen">Authenticating Session...</div>;

  return (
    <div className="viewport-screen active" id="screen-lap">
      <PasscodeModal
        isOpen={passcode.isOpen}
        config={passcode.config}
        error={passcode.error}
        onConfirm={passcode.confirm}
        onCancel={passcode.cancel}
      />

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-logo">
            <div className="header-icon">L</div>
            <div className="header-title">
              <h1>LAPCard Core Workspace</h1>
              <p>Underwriting & Collateral Management</p>
            </div>
          </div>
          <div className="user-profile">
            <div className="user-avatar">{user?.name?.[0]}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 9, color: "var(--color-cyan)" }}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>

        <div className="stage-nav-bar">
          {LAP_STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <button
                className={`stage-nav-btn ${navStep === i ? "active" : navStep > i ? "completed" : "locked"}`}
                onClick={() => handleNavTo(i)}
                disabled={!activeApplicant || i > (activeApplicant?.stage || 0)}
              >
                {stage.icon} Stage {i + 1}: {stage.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="dashboard-grid">
          <PipelinePanel
            applicants={applicants.filter((a) => !a.disbursed)}
            loading={dataLoading}
            activeId={activeApplicant?._id}
            onSelect={handleSelectApplicant}
            onStageAdvance={handleStageAdvance}
            onStartNew={() => setIsCreateModalOpen(true)}
          />
          <NewApplicantModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onRefresh={fetchApplicants}
          />
          <WorkspacePanel
            applicant={activeApplicant}
            mode={workspaceMode}
            navStep={navStep}
            onModeChange={setWorkspaceMode}
          />
          <CibilPanel applicant={activeApplicant} />
        </div>
      </div>
    </div>
  );
};

export default LAPDashboard;
