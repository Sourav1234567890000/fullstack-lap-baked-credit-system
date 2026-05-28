const mongoose = require('mongoose');

const dagNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: '📋' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  active: { type: Boolean, default: false },
  config: { type: mongoose.Schema.Types.Mixed },
});

const dagEdgeSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
});

const dagWorkflowSchema = new mongoose.Schema({
  name: { type: String, default: 'Default LAP Workflow' },
  nodes: [dagNodeSchema],
  edges: [dagEdgeSchema],
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('DagWorkflow', dagWorkflowSchema);