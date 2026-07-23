import { Flame } from 'lucide-react';

type DanceLoaderProps = {
	label: string;
	fullScreen?: boolean;
	inline?: boolean;
};

export function DanceLoader({ label, fullScreen = false, inline = false }: DanceLoaderProps) {
	const className = [
		'dance-loader',
		fullScreen ? 'dance-loader--screen' : '',
		inline ? 'dance-loader--inline' : '',
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={className} role='status' aria-live='polite'>
			<span className='dance-loader__mark' aria-hidden='true'>
				<span />
				<Flame size={inline ? 16 : 26} />
			</span>
			<span className='dance-loader__label'>{label}</span>
		</div>
	);
}
