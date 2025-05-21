import React from 'react';
import { IItem } from '../api/modules';
import { ProgressState } from '../api/progress';
import './SidebarMenu.css';

/* ------------------------------------------------------------------ */
/*  Types des props                                                    */
/* ------------------------------------------------------------------ */
export interface SidebarMenuProps {
  /** Arbre d’items du module */
  items:    IItem[];
  /** ID de l’item actuellement sélectionné */
  selected: string;
  /** Callback lorsqu’on choisit un item */
  onSelect: (id: string) => void;
  /** États des items */
  states: Record<string, ProgressState>;
}

/* ------------------------------------------------------------------ */
/*  Contexte interne : on évite de “passer” trois props à chaque       */
/*  niveau récursif ; on stocke selected / onSelect / states ici       */
/* ------------------------------------------------------------------ */
const CTX = React.createContext<
  Pick<SidebarMenuProps, 'selected' | 'onSelect' | 'states'> | null
>(null);

/* ------------------------------------------------------------------ */
/*  Sous‑composant récursif                                            */
/* ------------------------------------------------------------------ */
function Branch({ branch }: { branch: IItem[] }) {
  const ctx = React.useContext(CTX)!;        // le “!” car toujours défini ici
  const { selected, onSelect, states } = ctx;

  return (
    <ul className="sidebar">
      {branch.map((it) => {
        const st = states[it.id];
        const done = st === 'finished' || st === 'validated';
        const cls =
          `menu-item${it.id === selected ? ' active' : ''}` +
          `${done ? ' visited' : ''}`;

        return (
          <li key={it.id} className={cls}>
            <button type="button" onClick={() => onSelect(it.id)}>
              {it.title}
            </button>

            {/* ------------- Récursion sur les enfants, s’il y en a ------------- */}
            {(it.children?.length ?? 0) > 0 && (
              <Branch branch={it.children!} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Composant principal exporté                                        */
/* ------------------------------------------------------------------ */
export default function SidebarMenu(props: SidebarMenuProps) {
  const { items, selected, onSelect, states } = props;

  return (
    <CTX.Provider value={{ selected, onSelect, states }}>
      <nav>
        <Branch branch={items} />
      </nav>
    </CTX.Provider>
  );
}