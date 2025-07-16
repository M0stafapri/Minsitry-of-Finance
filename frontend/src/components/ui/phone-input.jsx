import React from "react";
import { Input } from "@/components/ui/input";
import { countryCodes } from "@/lib/utils/phoneValidation";
import "@/styles/flags.css";

export function PhoneInput({
  value,
  onChange,
  placeholder,
  className,
  required,
  error
}) {
  const [selectedCountry, setSelectedCountry] = React.useState("+20"); // Default to Egypt
  const [selectedFlag, setSelectedFlag] = React.useState("eg"); // Default to Egypt flag
  const [phoneNumber, setPhoneNumber] = React.useState("");

  // Initialize from value prop
  React.useEffect(() => {
    if (value) {
      // Find country code in the value
      const countryCode = countryCodes.find(cc => value.startsWith(cc.code));
      if (countryCode) {
        setSelectedCountry(countryCode.code);
        setSelectedFlag(countryCode.flag);
        setPhoneNumber(value.substring(countryCode.code.length));
      } else {
        // If no country code is found, assume it's a local number
        setPhoneNumber(value);
      }
    } else {
      setPhoneNumber("");
    }
  }, [value]);

  // Handle country code change
  const handleCountryChange = (e) => {
    const newCountryCode = e.target.value;
    setSelectedCountry(newCountryCode);
    
    // Update the flag based on the selected country code
    const country = countryCodes.find(cc => cc.code === newCountryCode);
    if (country) {
      setSelectedFlag(country.flag);
    }
    
    // Update the full phone number and call the onChange callback
    const newFullNumber = newCountryCode + phoneNumber;
    if (onChange) {
      onChange(newFullNumber);
    }
  };

  // Handle phone number change
  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    
    // Check if the input starts with a plus sign (potential country code)
    if (inputValue.startsWith('+')) {
      // Try to find a matching country code
      const matchingCountry = countryCodes.find(country => 
        inputValue.startsWith(country.code)
      );
      
      if (matchingCountry) {
        // Update the country code and flag
        setSelectedCountry(matchingCountry.code);
        setSelectedFlag(matchingCountry.flag);
        
        // Extract the phone number part (without country code)
        const newPhoneNumber = inputValue.substring(matchingCountry.code.length).replace(/[^0-9]/g, "");
        setPhoneNumber(newPhoneNumber);
        
        // Call the onChange callback with the full formatted number
        if (onChange) {
          onChange(matchingCountry.code + newPhoneNumber);
        }
        return;
      }
    }
    
    // If no country code detected or no match found, handle as regular input
    // Allow plus sign and digits for the phone field
    const newPhoneNumber = inputValue.replace(/[^0-9+]/g, "");
    setPhoneNumber(newPhoneNumber);
    
    // Update the full phone number and call the onChange callback
    const newFullNumber = newPhoneNumber.startsWith('+') ? newPhoneNumber : selectedCountry + newPhoneNumber;
    if (onChange) {
      onChange(newFullNumber);
    }
  };

  return (
    <div className={`flex flex-row-reverse ${className}`}>
      <div className="relative flex items-center">
        <div className="absolute right-3 z-10 pointer-events-none">
          <span className={`flag flag-${selectedFlag}`}></span>
        </div>
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          className="h-10 rounded-r-md border border-l-0 border-input bg-background pr-10 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
          style={{ direction: "ltr" }}
        >
          {countryCodes.map((country) => (
            <option key={`${country.code}-${country.flag}`} value={country.code}>
              {country.code}
            </option>
          ))}
        </select>
      </div>
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        className={`rounded-r-none ${error ? "border-red-500" : ""}`}
        placeholder={`${placeholder} (يمكنك كتابة رمز الدولة مباشرة مثل +20)`}
        required={required}
        style={{ direction: "ltr" }}
      />
    </div>
  );
}
