// src/app/(public)/kemitraan/components/OpenProjectSection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/utils/format';
import {
  OpenProject,
  OpenProjectCategory,
  OPEN_PROJECT_CATEGORY_LABELS,
} from '@/types/partnership.types';
import ProjectApplicationModal from './ProjectApplicationModal';

interface OpenProjectSectionProps {
  projects: OpenProject[];
}

export default function OpenProjectSection({ projects }: OpenProjectSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<OpenProject | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'ALL') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  const handleOpenApply = (project: OpenProject) => {
    setSelectedProject(project);
    setIsApplyModalOpen(true);
  };

  return (
    <div id="open-project" className="space-y-6 pt-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-2">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span>Industrial Open Project Hub</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Peluang Proyek Nyata Industri untuk Talenta & Alumni STP
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 leading-relaxed">
            Mitra industri mempercayakan tantangan rekayasa, prototipe manufaktur, hingga pengujian keamanan siber kepada alumni tersertifikasi Solo Technopark dengan kurasi resmi dan perlindungan kompensasi transparan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/mitra">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-bold gap-2"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mitra: Pasang Proyek Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Kategori Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Proyek ({projects.length})
        </button>
        {Object.entries(OPEN_PROJECT_CATEGORY_LABELS).map(([catKey, label]) => {
          const count = projects.filter((p) => p.category === catKey).length;
          if (count === 0 && selectedCategory !== catKey) return null;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === catKey
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid Proyek */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-emerald-300 transition-all group"
          >
            <div className="space-y-3.5">
              {/* Top metadata */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 line-clamp-1">
                      {project.partnerName}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {project.partnerSector || 'Mitra Industri Solo Technopark'}
                    </span>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="bg-emerald-50/80 border-emerald-200 text-emerald-800 text-[10px] font-bold shrink-0"
                >
                  {OPEN_PROJECT_CATEGORY_LABELS[project.category] || project.category}
                </Badge>
              </div>

              {/* Title & Desc */}
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                  {project.description}
                </p>
              </div>

              {/* Skills Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.requiredSkills?.slice(0, 4).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Deliverables bullet preview */}
              {project.deliverables && project.deliverables.length > 0 && (
                <div className="space-y-1 bg-slate-50 rounded-2xl p-3 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider block">
                    Target Output Proyek:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 line-clamp-2">
                    {project.deliverables.slice(0, 2).map((del, idx) => (
                      <li key={idx} className="truncate">
                        {del}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom info & CTA */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Nilai Kompensasi</span>
                <span className="text-base font-black text-emerald-700">
                  {formatRupiah(project.budgetAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Estimasi: {project.durationEstimate} ({project.workSetup})
                </span>
              </div>

              <Button
                type="button"
                onClick={() => handleOpenApply(project)}
                className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <span>Ajukan Proposal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProjectApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        project={selectedProject}
      />
    </div>
  );
}

