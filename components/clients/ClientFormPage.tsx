// components/clients/ClientFormPage.tsx
import { useState, useEffect } from "react";
import { ChevronRight, Info } from "lucide-react";

interface ClientFormPageProps {
  mode: "create" | "edit";
  clientId?: string;
  onNavigate: (path: string) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  businessPhone: string;
  mobilePhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  currency: string;
  notes: string;
}

export function ClientFormPage({
  mode,
  clientId,
  onNavigate,
}: ClientFormPageProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    businessPhone: "",
    mobilePhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    currency: "USD",
    notes: "",
  });

  const [showBusinessPhone, setShowBusinessPhone] = useState(false);
  const [showMobilePhone, setShowMobilePhone] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "edit" && clientId) {
      fetchClient();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientId]);

  async function fetchClient() {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to load client");
      }

      const data = await response.json();
      if (data.client) {
        const nameParts = (data.client.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setFormData((prev) => ({
          ...prev,
          firstName,
          lastName,
          company: data.client.company || "",
          email: data.client.email || "",
          phone: data.client.phone || "",
          // if you later add these to the API, they’ll populate here
          businessPhone: data.client.businessPhone || "",
          mobilePhone: data.client.mobilePhone || "",
          addressLine1: data.client.addressLine1 || "",
          addressLine2: data.client.addressLine2 || "",
          city: data.client.city || "",
          state: data.client.state || "",
          postalCode: data.client.postalCode || "",
          country: data.client.country || "",
          currency: data.client.currency || "USD",
          notes: data.client.notes || "",
        }));

        if (data.client.addressLine1) {
          setShowAddress(true);
        }
        if (data.client.businessPhone) {
          setShowBusinessPhone(true);
        }
        if (data.client.mobilePhone) {
          setShowMobilePhone(true);
        }
      }
    } catch (err) {
      console.error("Error fetching client:", err);
      setError("Failed to load client");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!fullName && !formData.company) {
      setError("Either First and Last Name or Company Name is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        displayName: fullName,
        email: formData.email,
        phone: formData.phone,
        businessPhone: formData.businessPhone,
        mobilePhone: formData.mobilePhone,
        company: formData.company,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        currency: formData.currency,
        notes: formData.notes,
      };

      const url =
        mode === "create" ? `/api/clients` : `/api/clients/${clientId}`;

      const response = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save client");
      }

      const result = await response.json();
      if (mode === "create") {
        onNavigate(`client-detail-${result.id}`);
      } else {
        onNavigate(`client-detail-${clientId}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-[1132px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {mode === "create" ? "New Client" : "Edit Client"}
          </h1>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  mode === "edit" && clientId
                    ? `client-detail-${clientId}`
                    : "clients"
                )
              }
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left: main form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
              {/* Info banner */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700">
                  Either First and Last Name or Company Name is required to save
                  this Client.
                </p>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Company */}
              <div className="border-b border-slate-300">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className="mb-6 w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Primary phone */}
              <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              </div>

              {/* Add Business / Mobile phone links + fields */}
              <div className="grid grid-cols-2 gap-3">
              <div>
                {!showBusinessPhone ? (
                  <button
                    type="button"
                    onClick={() => setShowBusinessPhone(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Business Phone
                  </button>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Business Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessPhone: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
              <div>
                {!showMobilePhone ? (
                  <button
                    type="button"
                    onClick={() => setShowMobilePhone(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Mobile Phone
                  </button>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.mobilePhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          mobilePhone: e.target.value,
                        }))
                      }
                      className="w-full border border-slate-300 text-slate-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              </div>

              {/* Address section */}
              <div className="pt-4 border-t border-slate-300">
                {!showAddress ? (
                  <button
                    type="button"
                    onClick={() => setShowAddress(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    + Add Address
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Address
                    </h3>

                    {/* Country */}
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Country
                      </label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={formData.country}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    </div>

                    {/* Address lines */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        value={formData.addressLine1}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressLine1: e.target.value,
                          }))
                        }
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        placeholder="Address Line 2"
                        value={formData.addressLine2}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            addressLine2: e.target.value,
                          }))
                        }
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* City / State */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          State/Province
                        </label>
                        <input
                          type="text"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* PostalCode */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={formData.postalCode}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              postalCode: e.target.value,
                            }))
                          }
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Client settings column */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">
                  Client Settings
                </h2>
              </div>

              <div className="divide-y divide-slate-200">
                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        Send Reminders
                        <span className="text-xs font-semibold text-slate-600">
                          NO
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        At Customizable Intervals
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>

                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">$</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        Charge Late Fees
                        <span className="text-xs font-semibold text-slate-600">
                          NO
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Percentage or Flat-Rate Fees
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>

                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">�</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">
                        Currency &amp; Language
                      </div>
                      <div className="text-xs text-slate-500">
                        USD, English (United States)
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>

                <button className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">�</span>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        Invoice Attachments
                        <span className="text-xs font-semibold text-slate-600">
                          NO
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Attach PDF copy to emails
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
