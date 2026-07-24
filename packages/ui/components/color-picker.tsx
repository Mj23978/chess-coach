"use client";

import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Check, Paintbrush, Pipette } from "lucide-react";
import { HexColorPicker } from "react-colorful";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { Input } from "./input";

export interface ColorPickerDropdownProps {
	value?: string;
	defaultValue: string;
	onChange: (color: string) => void;
	presetColors?: string[];
}

export function ColorPickerDropdown({
	value: _value,
	onChange,
	defaultValue,
	presetColors = [],
}: ColorPickerDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const pipetteRef = useRef<HTMLButtonElement>(null);
	const value = _value || defaultValue;

	const handleColorChange = useCallback(
		(color: string) => {
			onChange(color);
		},
		[onChange],
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
			handleColorChange(newColor);
		}
	};

	const handlePipette = useCallback(() => {
		if (typeof window !== 'undefined') return
		if (!(window as any).EyeDropper) {
			alert("Your browser doesn't support the EyeDropper API");
			return;
		}

		const eyeDropper = new (window as any).EyeDropper();
		eyeDropper
			.open()
			.then((result: { sRGBHex: string }) => {
				handleColorChange(result.sRGBHex);
			})
			.catch((e: Error) => {
				console.error("EyeDropper error:", e);
			});
	}, [handleColorChange]);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="w-[180px] justify-start text-left font-normal"
				>
					<div
						className="w-4 h-4 rounded-full mr-2 border border-gray-200"
						style={{ backgroundColor: value }}
					/>
					<span>{value}</span>
					<Paintbrush className="w-4 h-4 ml-auto" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="p-3 space-y-3" style={{ width: "240px" }}>
				<HexColorPicker
					color={value}
					onChange={handleColorChange}
					style={{ width: "100%" }}
				/>
				{presetColors.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-2">
						{presetColors.map((presetColor) => (
							<Button
								key={presetColor}
								className="w-6 h-6 p-0 rounded-full relative"
								style={{ backgroundColor: presetColor }}
								onClick={() => handleColorChange(presetColor)}
							>
								{value === presetColor && (
									<Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
								)}
								<span className="sr-only">Select color: {presetColor}</span>
							</Button>
						))}
					</div>
				)}
				<div className="flex space-x-2">
					<Input
						value={value}
						onChange={handleInputChange}
						className="flex-grow"
					/>
					<Button
						size="icon"
						variant="outline"
						onClick={handlePipette}
						ref={pipetteRef}
					>
						<Pipette className="w-4 h-4" />
					</Button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
