const Applicant = require("../models/applicant.model");
const AuditLog = require("../models/auditlog.model");

// GET all applicants (with filters)
exports.getApplicants = async (req, res) => {
  try {
    const { stage, disbursed, search, area, page = 1, limit = 20 } = req.query;
    const query = {};
    if (stage !== undefined) query.stage = Number(stage);
    if (disbursed !== undefined) query.disbursed = disbursed === "true";
    if (area) query.propertyArea = area;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { lapAppNo: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [applicants, total] = await Promise.all([
      Applicant.find(query)
        .populate("assignedOfficer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Applicant.countDocuments(query),
    ]);
    res.json({
      success: true,
      data: applicants,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single applicant
exports.getApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id).populate(
      "assignedOfficer",
      "name email",
    );
    if (!applicant)
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE applicant
exports.createApplicant = async (req, res) => {
  try {
    const applicantData = { ...req.body, assignedOfficer: req.user._id };
    const applicant = await Applicant.create(applicantData);
    await AuditLog.create({
      role: req.user.role,
      user: req.user._id,
      userName: req.user.name,
      action: `Created applicant: ${applicant.name} (${applicant.lapAppNo})`,
      entity: "Applicant",
      entityId: applicant._id,
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE applicant
exports.updateApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!applicant)
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    await AuditLog.create({
      role: req.user.role,
      user: req.user._id,
      userName: req.user.name,
      action: `Updated applicant: ${applicant.name}`,
      entity: "Applicant",
      entityId: applicant._id,
      ip: req.ip,
    });
    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE applicant
exports.deleteApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findByIdAndDelete(req.params.id);
    if (!applicant)
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    await AuditLog.create({
      role: req.user.role,
      user: req.user._id,
      userName: req.user.name,
      action: `Deleted applicant: ${applicant.name}`,
      entity: "Applicant",
      entityId: applicant._id,
      ip: req.ip,
    });
    res.json({ success: true, message: "Applicant removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADVANCE STAGE (requires passcode - verified in middleware)
exports.advanceStage = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant)
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    if (
      applicant.cibil === 0 ||
      !applicant.otpVerified ||
      !applicant.faceVerified
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Complete CIBIL pull and biometric verification first",
        });
    }
    if (applicant.stage >= 4) {
      return res
        .status(400)
        .json({ success: false, message: "Applicant already at final stage" });
    }
    applicant.stage += 1;
    if (applicant.stage === 4) applicant.disbursed = true;
    await applicant.save();
    await AuditLog.create({
      role: req.user.role,
      user: req.user._id,
      userName: req.user.name,
      action: `Stage advanced to ${applicant.stage} for ${applicant.name} (${applicant.lapAppNo})`,
      entity: "Applicant",
      entityId: applicant._id,
      ip: req.ip,
    });
    res.json({
      success: true,
      data: applicant,
      message: `Advanced to Stage ${applicant.stage}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VERIFY CIBIL (simulate fetch)
// exports.verifyCibil = async (req, res) => {
//   try {
//     const applicant = await Applicant.findById(req.params.id);
//     if (!applicant)
//       return res
//         .status(404)
//         .json({ success: false, message: "Applicant not found" });
//     const { step, otpCode } = req.body;
//     if (step === "fetch") {
//       // Mark that fetch was initiated - OTP sent
//       res.json({
//         success: true,
//         message: "OTP sent to registered mobile",
//         step: "otp",
//       });
//     } else if (step === "otp") {
//       // Verify OTP (simulated: any 6-digit code)
//       const HARDCODED_OTP = "123456";
//       if (otpCode === HARDCODED_OTP) {
//         applicant.otpVerified = true;
//         await applicant.save();
//         res.json({ success: true, message: "OTP verified", step: "face" });
//       }
//       // if (!otpCode || otpCode.length < 6)
//       //   return res.status(400).json({ success: false, message: "Invalid OTP" });
//       // applicant.otpVerified = true;
//       // await applicant.save();
//       // res.json({ success: true, message: "OTP verified", step: "face" });
//     } else if (step === "face") {
//       // Biometric face scan complete
//       const cibilScore = Math.floor(Math.random() * 200) + 600; // 600-800 range
//       applicant.faceVerified = true;
//       applicant.cibil = cibilScore;
//       applicant.fieldsFilled = applicant.fieldsTotal;
//       await applicant.save();
//       await AuditLog.create({
//         role: req.user.role,
//         user: req.user._id,
//         userName: req.user.name,
//         action: `CIBIL generated: ${cibilScore} for ${applicant.name}`,
//         entity: "Applicant",
//         entityId: applicant._id,
//         ip: req.ip,
//       });
//       res.json({
//         success: true,
//         message: "CIBIL verified successfully",
//         cibil: cibilScore,
//         step: "success",
//         data: applicant,
//       });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };




exports.verifyCibil = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant not found" });
    }

    const { step, otpCode } = req.body;

    // 1. FETCH STEP
    if (step === "fetch") {
      return res.json({
        success: true,
        message: "OTP sent to registered mobile",
        step: "otp",
      });
    } 
    
    // 2. OTP STEP (Hardcoded for testing)
    else if (step === "otp") {
      const HARDCODED_OTP = "123456";
      
      if (otpCode === HARDCODED_OTP) {
        applicant.otpVerified = true;
        await applicant.save();
        return res.json({ success: true, message: "OTP verified", step: "face" });
      } else {
        // Must return here to stop the loading spinner
        return res.status(400).json({ success: false, message: "Invalid OTP. Use 123456" });
      }
    } 
    
    // 3. FACE/CIBIL STEP
    else if (step === "face") {
      // Mock CIBIL score for all testing
      const cibilScore = 750; 
      
      applicant.faceVerified = true;
      applicant.cibil = cibilScore;
      applicant.fieldsFilled = applicant.fieldsTotal;
      
      await applicant.save();
      
      // Log the action
      await AuditLog.create({
        role: req.user.role,
        user: req.user._id,
        userName: req.user.name,
        action: `CIBIL generated: ${cibilScore} for ${applicant.name}`,
        entity: "Applicant",
        entityId: applicant._id,
        ip: req.ip,
      });

      return res.json({
        success: true,
        message: "CIBIL verified successfully",
        cibil: cibilScore,
        step: "success",
        data: applicant,
      });
    }

    // Handle unknown steps
    return res.status(400).json({ success: false, message: "Invalid step provided" });

  } catch (error) {
    console.error("verifyCibil Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




// ADD CO-APPLICANT
exports.addCoApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    if (!applicant)
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });

    // Check if any existing co-applicant in the array already uses the incoming email
    const emailExists = applicant.coApplicants.some(
      (coApp) => coApp.email === req.body.email,
    );

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message:
          "A co-applicant with this email has already been added to this application.",
      });
    }

    applicant.coApplicants.push(req.body);
    await applicant.save();
    res.json({ success: true, data: applicant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DASHBOARD ANALYTICS (Officer)
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalActive, byStage, byArea, recentApplicants, disbursedTotal] =
      await Promise.all([
        Applicant.countDocuments({ disbursed: false }),
        Applicant.aggregate([
          {
            $group: {
              _id: "$stage",
              count: { $sum: 1 },
              totalAmount: { $sum: "$loanAmount" },
            },
          },
        ]),
        Applicant.aggregate([
          {
            $group: {
              _id: "$propertyArea",
              count: { $sum: 1 },
              totalValue: { $sum: "$propertyValue" },
            },
          },
        ]),
        Applicant.find({ disbursed: false })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("name lapAppNo stage cibil loanAmount"),
        Applicant.aggregate([
          { $match: { disbursed: true } },
          {
            $group: {
              _id: null,
              total: { $sum: "$loanAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);
    const emiPending = await Applicant.aggregate([
      { $match: { stage: { $gte: 1 }, disbursed: false } },
      { $group: { _id: null, totalEmi: { $sum: "$emi" }, count: { $sum: 1 } } },
    ]);
    res.json({
      success: true,
      data: {
        totalActive,
        byStage,
        byArea,
        recentApplicants,
        disbursedTotal: disbursedTotal[0] || { total: 0, count: 0 },
        emiPending: emiPending[0] || { totalEmi: 0, count: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
