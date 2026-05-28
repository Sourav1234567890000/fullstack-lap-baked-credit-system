const DagWorkflow = require('../models/dagworkflow.model');
const AuditLog = require('../models/auditlog.model');

const DEFAULT_WORKFLOW = {
  name: 'Default LAP Workflow',
  isDefault: true,
  nodes: [
    { nodeId: 'n1', label: 'In-Principle', icon: '📋', x: 20, y: 110, active: true },
    { nodeId: 'n2', label: 'CIBIL Check', icon: '🛡️', x: 130, y: 60, active: true },
    { nodeId: 'n3', label: 'KYC Biometric', icon: '👁️', x: 130, y: 160, active: true },
    { nodeId: 'n4', label: 'Appraisal', icon: '🏠', x: 240, y: 110, active: true },
    { nodeId: 'n5', label: 'Legal Gate', icon: '⚖️', x: 350, y: 110, active: false },
    { nodeId: 'n6', label: 'Underwriting', icon: '✅', x: 460, y: 110, active: false },
    { nodeId: 'n7', label: 'Disburse', icon: '💳', x: 560, y: 110, active: false }
  ],
  edges: [
    { from: 'n1', to: 'n2' }, { from: 'n1', to: 'n3' },
    { from: 'n2', to: 'n4' }, { from: 'n3', to: 'n4' },
    { from: 'n4', to: 'n5' }, { from: 'n5', to: 'n6' }, { from: 'n6', to: 'n7' }
  ]
};

exports.getWorkflow = async (req, res) => {
  try {
    let workflow = await DagWorkflow.findOne({ isDefault: true });
    if (!workflow) {
      workflow = await DagWorkflow.create({ ...DEFAULT_WORKFLOW, createdBy: req.user._id });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveWorkflow = async (req, res) => {
  try {
    const { nodes, edges, name } = req.body;
    let workflow = await DagWorkflow.findOne({ isDefault: true });
    if (workflow) {
      workflow.nodes = nodes;
      workflow.edges = edges;
      if (name) workflow.name = name;
      await workflow.save();
    } else {
      workflow = await DagWorkflow.create({ nodes, edges, name, isDefault: true, createdBy: req.user._id });
    }
    await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: `DAG workflow saved: ${nodes.length} nodes, ${edges.length} edges`, ip: req.ip });
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetWorkflow = async (req, res) => {
  try {
    await DagWorkflow.deleteMany({ isDefault: true });
    const workflow = await DagWorkflow.create({ ...DEFAULT_WORKFLOW, createdBy: req.user._id });
    await AuditLog.create({ role: req.user.role, user: req.user._id, userName: req.user.name, action: 'DAG workflow reset to default', ip: req.ip });
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};