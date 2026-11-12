import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Shirt, Sparkles, UserRound, ScanFace, Palette } from "lucide-react";
import rpc from "rage-rpc";

import { useCreateCharacter } from "../api/mutations/create-character";
import { type FormSchema, formSchema } from "../schema";
import { Appearance } from "./sections/appearance";
import { Character } from "./sections/character";
import { Clothes } from "./sections/clothes";
import { Colors } from "./sections/colors";
import { Features } from "./sections/features";
import "./create-character.css";

export { zodResolver } from "@hookform/resolvers/zod";

export type Section = "character" | "appearance" | "colors" | "features" | "clothes";

const sections: { label: string; value: Section }[] = [
  { label: "Генетика", value: "character" },
  { label: "Кожа", value: "appearance" },
  { label: "Волосы и цвет", value: "colors" },
  { label: "Черты лица", value: "features" },
  { label: "Одежда", value: "clothes" },
];

const sectionIcons = [Sparkles, UserRound, Palette, ScanFace, Shirt];

export const CreateCharacter = () => {
  const { state } = useLocation();
  const initialSex: "male" | "female" = state?.sex === "female" ? "female" : "male";
  const initialName = [state?.name, state?.surname].filter(Boolean).join(" ") || "Ray Washington";
  const [currentSection, setCurrentSection] = useState<Section>("character");

  const { mutate, isPending } = useCreateCharacter();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName,
      age: 18,

      headBlendData: {
        mother: 21,
        father: 0,
        sex: initialSex,
        similarity: 0.5,
        skinTone: 0.5,
      },

      faceFeature: {
        noseWidth: 0,
        noseHeight: 0,
        noseLength: 0,
        noseBridge: 0,
        noseTip: 0,
        noseBridgeShift: 0,
        browHeight: 0,
        browWidth: 0,
        cheekboneHeight: 0,
        cheekboneWidth: 0,
        cheeksWidth: 0,
        eyes: 0,
        lips: 0,
        jawWidth: 0,
        jawHeight: 0,
        chinLength: 0,
        chinPosition: 0,
        chinWidth: 0,
        chinShape: 0,
        neckWidth: 0,
      },

      headOverlay: {
        ageing: 0,
        blemishes: 0,

        complexion: 0,
        eyebrows: 0,
        lipstick: 0,
        makeup: 0,
        molesFreckles: 0,
        sunDamage: 0,
      },

      colors: {
        hairStyle: 0,
        facialHair: 0,
        eyeColor: 0,
        hairColor: 1,
        beardColor: 1,
      },

      clothes: {
        TORSO: 0,
        FEET: 1,
        LEGS: 4,
      },
    },
  });

  const handleSubmit = (data: FormSchema) => mutate(data);
  const handleRotation = (value: number) => rpc.callClient("create-character:rotate-character", value);

  const renderSection = () => {
    switch (currentSection) {
      case "character":
        return <Character setStep={setCurrentSection} />;

      case "appearance":
        return <Appearance setStep={setCurrentSection} />;

      case "colors":
        return <Colors setStep={setCurrentSection} />;

      case "features":
        return <Features setStep={setCurrentSection} />;

      case "clothes":
        return <Clothes isLoading={isPending} />;
    }
  };

  const headBlendData = useWatch({ control: form.control }).headBlendData;
  const headOverlay = useWatch({ control: form.control }).headOverlay;
  const faceFeature = useWatch({ control: form.control }).faceFeature;
  const colors = useWatch({ control: form.control }).colors;
  const clothes = useWatch({ control: form.control }).clothes;

  const prev = useRef({ headBlendData, headOverlay, faceFeature, colors, clothes });

  useEffect(() => {
    if (JSON.stringify(headBlendData) !== JSON.stringify(prev.current.headBlendData)) {
      rpc.callClient("create-character:update-head-blend", headBlendData);
      if (headBlendData?.sex !== prev.current.headBlendData?.sex) {
        rpc.callClient("create-character:update-clothes", clothes);
      }
    }

    if (JSON.stringify(headOverlay) !== JSON.stringify(prev.current.headOverlay)) {
      rpc.callClient("create-character:update-head-overlay", headOverlay);
    }

    if (JSON.stringify(faceFeature) !== JSON.stringify(prev.current.faceFeature)) {
      rpc.callClient("create-character:update-face-feature", faceFeature);
    }

    if (JSON.stringify(colors) !== JSON.stringify(prev.current.colors)) {
      rpc.callClient("create-character:update-colors", colors);
    }

    if (JSON.stringify(clothes) !== JSON.stringify(prev.current.clothes)) {
      rpc.callClient("create-character:update-clothes", clothes);
    }

    prev.current = { headBlendData, headOverlay, faceFeature, colors, clothes };
  }, [headBlendData, headOverlay, faceFeature, colors, clothes]);

  useEffect(() => {
    if (currentSection === "clothes") {
      rpc.callClient("create-character:interpolate-full");
    } else {
      rpc.callClient("create-character:interpolate-face");
    }
  }, [currentSection]);

  return (
    <div className="character-creator">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="character-creator__layout">
          <aside className="character-creator__sidebar">
            <div className="character-creator__brand">
              <span className="character-creator__brand-icon"><Sparkles size={19} /></span>
              <div><span>LOS SANTOS</span><strong>Редактор персонажа</strong></div>
            </div>

            <div className="character-creator__identity">
              <div className="character-creator__eyebrow">НОВЫЙ ПЕРСОНАЖ</div>
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя и фамилия</FormLabel>
                    <FormControl><Input placeholder="Например, Ray Washington" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="age"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Возраст</FormLabel>
                    <FormControl><Input type="number" min={18} max={90} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <nav className="character-creator__navigation" aria-label="Разделы редактора">
              <div className="character-creator__eyebrow">ВНЕШНОСТЬ</div>
              {sections.map((section, index) => {
                const Icon = sectionIcons[index];
                const active = section.value === currentSection;
                return (
                  <Button
                    key={section.value}
                    type="button"
                    variant="ghost"
                    className={`character-creator__nav-item${active ? " is-active" : ""}`}
                    aria-current={active ? "step" : undefined}
                    onClick={() => setCurrentSection(section.value)}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{section.label}</span>
                    {active && <ChevronRight className="character-creator__nav-arrow" size={16} />}
                  </Button>
                );
              })}
            </nav>

            <div className="character-creator__progress">
              <div className="character-creator__progress-label"><span>ШАГ {sections.findIndex((section) => section.value === currentSection) + 1}</span><span>ИЗ {sections.length}</span></div>
              <div className="character-creator__progress-track"><span style={{ width: `${((sections.findIndex((section) => section.value === currentSection) + 1) / sections.length) * 100}%` }} /></div>
            </div>
          </aside>

          <main className="character-creator__workspace">
            <div className="character-creator__workspace-heading">
              <div><span className="character-creator__eyebrow">НАСТРОЙКА ВНЕШНОСТИ</span><h1>{sections.find((section) => section.value === currentSection)?.label}</h1></div>
              <div className="character-creator__rotation">
                <span>ПОВОРОТ</span>
                <Slider max={360} min={0} step={5} onValueChange={(value) => handleRotation(value[0])} />
              </div>
            </div>
            <div className="character-creator__controls">{renderSection()}</div>
            <div className="character-creator__tip"><span>ПОДСКАЗКА</span> Настройки внешности можно изменить в любой момент до создания персонажа.</div>
          </main>
        </form>
      </Form>
    </div>
  );
};
