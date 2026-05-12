import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        phone: {
            type: String,
            sparse: true,
        },
        avatar: {
            type: String,
            trim: true,
            default: "",
        },

        vehicleType: {
            type: String,
            enum: ["bike", "cycle", "scooter"],
            default: "bike",
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        address: {
            type: String,
            trim: true,
        },

        accountHolder: {
            type: String,
            trim: true,
        },

        accountNumber: {
            type: String,
            trim: true,
        },

        ifsc: {
            type: String,
            trim: true,
        },

        documents: {
            aadhar: { type: String },
            pan: { type: String },
            drivingLicense: { type: String },
        },

        vehicleNumber: {
            type: String,
            trim: true,
        },
        vehicleModel: {
            type: String,
            trim: true,
        },
        vehicleColor: {
            type: String,
            trim: true,
        },
        fuelType: {
            type: String,
            trim: true,
        },
        drivingLicenseNumber: {
            type: String,
            trim: true,
        },
        drivingLicenseExpiry: {
            type: String,
        },
        rcExpiry: {
            type: String,
        },

        currentArea: {
            type: String,
            trim: true,
        },
        dob: {
            type: String, // Or Date
        },
        bloodGroup: {
            type: String,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: false,
        },

        applicationStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        reviewedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: "",
        },



        isOnline: {
            type: Boolean,
            default: false,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
        role: {
            type: String,
            default: "delivery",
        },

        otp: {
            type: String,
            select: false,
        },

        otpExpiry: {
            type: Date,
            select: false,
        },

        subscriptionStatus: {
            type: String,
            enum: ["active", "inactive", "expired"],
            default: "inactive",
        },
        lastLogin: Date,

        /** Last GPS fix from POST /delivery/location (for radius matching). */
        lastLocationAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

deliverySchema.index({ location: "2dsphere" });
deliverySchema.index({ isOnline: 1, isVerified: 1 });
deliverySchema.index({ lastLocationAt: -1 });

deliverySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

export default mongoose.model("Delivery", deliverySchema);
